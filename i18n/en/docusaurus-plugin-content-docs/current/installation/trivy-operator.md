---
id: trivy-operator
title: Installing Trivy Operator (Vulnerability Scanning)
sidebar_position: 5
---

# Installing Trivy Operator (Vulnerability Scanning)

## Why You Need It

The [Vulnerabilities](../features/vulnerabilities.md) page added in v0.60 shows the scan results of [Trivy Operator](https://github.com/aquasecurity/trivy-operator). **K8s Sentinel itself does not scan the images of running workloads**: Trivy Operator does the scanning and writes `VulnerabilityReport` resources, and K8s Sentinel only reads and presents them.

Trivy Operator is an **optional component**. Without it, the Vulnerabilities page says that scanning is not enabled, and every other feature is completely unaffected.

| Installation method | Installs Trivy Operator automatically? |
|---|---|
| [Kubernetes Job Installation](./job-install.md) | Yes (since v0.61), skipped when it already exists |
| [Local Script Installation](./script-install.md) | Yes (since v0.61), skipped when it already exists |
| Applying only `deploy/sentinel.yaml` | No, install it manually by following this page |

Both installers put Trivy Operator into **`sentinel-system`** (the same namespace as K8s Sentinel), as the Helm release `trivy-operator`; they skip it whenever a Trivy Operator Deployment already exists in any namespace of the cluster.

---

## Manual Installation

First confirm that `deploy/sentinel.yaml` has been applied (it creates the `sentinel-system` namespace), then run the following from the K8s Sentinel source directory:

```bash
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm repo update
helm install trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml
```

Confirm the operator is ready, and watch the reports appear as they complete:

```bash
kubectl rollout status deployment/trivy-operator -n sentinel-system
kubectl get vulnerabilityreports -A
```

---

## What trivy-operator-values.yaml Does

`deploy/trivy-operator-values.yaml` is the Helm values file provided by K8s Sentinel. It does four things:

| Setting | Reason |
|---|---|
| **Keeps only the vulnerability scanner** | K8s Sentinel only reads `VulnerabilityReport`. Config audit, RBAC and infra assessment, compliance, exposed secret scanning and SBOM generation are all turned off so they do not add needless load. The infra assessment would also start a `node-collector` Pod with host access on every node |
| **Fits the Pods to the namespace's security level** | `sentinel-system` enforces the restricted Pod Security level, so the operator and the scan Pods all run as a non-root user with the default seccomp profile |
| **One Trivy server shared by all scans** | The `trivy-server` Pod holds the vulnerability database and the scan cache, and the scan Pods are just its clients. Left to the chart's default, every scan Pod has to download the database for itself, and the containers of one scan Pod compete for a single cache lock: the ones that lose fail with `cache may be in use by another process`, leaving workloads with several images partly scanned or not scanned. The server keeps its database in an `emptyDir`, so it needs no StorageClass and downloads the database again after a restart |
| **15 minutes per scan (default 5 minutes)** | Pulling a large image over a slow network can exceed the chart's default. A scan that times out is simply removed without leaving an error in the operator log, and the workload just stays not scanned |

---

## Scan Behavior

- The operator scans every workload once after it starts; after that it rescans when a workload changes or a report expires (24 hours by default)
- Each scan is a short-lived `scan-vulnerabilityreport-*` Pod in `sentinel-system`: one Pod per workload with one container per image, at most 10 at a time (`operator.scanJobsConcurrentLimit`)
- A burst of scan Pods appears right after installation; that is the first pass over the whole cluster, and they are removed automatically as they finish

---

## Upgrade Notes

### Upgrading From a Version Without the Vulnerabilities Page (v0.59 and Earlier)

Re-apply `deploy/sentinel.yaml`. The ClusterRole gained read-only rules for `vulnerabilityreports` and `jobs`; without the former, the page reports that K8s Sentinel is not permitted to read reports.

```bash
kubectl apply -f deploy/sentinel.yaml
```

### Upgrading to a Version With Registry Scanning (v0.62+)

1. Re-apply `deploy/sentinel.yaml`: it adds the Role `sentinel-registry-scan` in `sentinel-system` for the registry scan Jobs; without it every registry scan fails with a permission error
2. Upgrade the operator with the current values so that it does not scan those Jobs:

```bash
helm upgrade trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml
```

### Workloads That Stay partial or Not scanned

An operator installed with an older copy of the values runs without the Trivy server described above. Apply the current values with the same `helm upgrade` command, then restart the operator so that it scans what is missing:

```bash
kubectl -n sentinel-system rollout restart deployment/trivy-operator
```

### Moving an Operator That v0.61.0 Installed Into `trivy-system`

The v0.61.0 installers put the operator into `trivy-system`; since v0.61.1 they put it into `sentinel-system`. To move it:

```bash
helm uninstall trivy-operator --namespace trivy-system
kubectl delete namespace trivy-system
bash deploy/install.sh
```

Existing vulnerability reports are stored in the namespaces of the workloads they belong to, so they are not lost by this.

### Clearing Reports Left Behind by the Other Scanners

An operator that ever ran with the chart's defaults wrote reports for every scanner, and turning a scanner off does not delete what it already wrote. Nothing reads these reports any more, they never expire, and the SBOM reports alone can be larger than all the vulnerability reports put together. Clear them once:

```bash
kubectl delete sbomreports,configauditreports,exposedsecretreports,rbacassessmentreports,infraassessmentreports --all --all-namespaces
kubectl delete clustersbomreports,clusterconfigauditreports,clusterrbacassessmentreports,clusterinfraassessmentreports --all
```

Keep them if another tool reads these reports; K8s Sentinel does not use them.

---

## Air-gapped Clusters

:::tip
Since v0.71.0 every release carries an offline bundle that takes care of carrying the images, rewriting the manifests and setting the environment variables below; see [Offline Installation](./offline-install.md). This section covers the manual setup without the bundle.
:::

Trivy downloads its vulnerability database as an OCI artifact, and by default pulls the database and its own image from `mirror.gcr.io`. For a cluster with no outbound access, copy the following into a registry the cluster can reach:

| Item | Default location |
|---|---|
| Trivy image | `mirror.gcr.io/aquasec/trivy` |
| Vulnerability database | `mirror.gcr.io/aquasec/trivy-db` |
| Java index database | `mirror.gcr.io/aquasec/trivy-java-db` |

Then point the chart at that registry with an additional values file (for example `trivy-values.yaml`):

```yaml
trivy:
  image:
    registry: registry.internal.example
  dbRegistry: registry.internal.example
  dbRepository: aquasec/trivy-db
  javaDbRegistry: registry.internal.example
  javaDbRepository: aquasec/trivy-java-db
```

```bash
helm install trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml \
  --values trivy-values.yaml
```

**Registry scans are started by K8s Sentinel, not by the operator**, so the same locations have to be set separately as environment variables on the K8s Sentinel Deployment:

| Environment variable | Default | Description |
|---|---|---|
| `TRIVY_IMAGE` | `mirror.gcr.io/aquasec/trivy:0.76.1` | The Trivy image that registry scans run |
| `TRIVY_DB_REPOSITORY` / `TRIVY_JAVA_DB_REPOSITORY` | Trivy's defaults | Where registry scans download the vulnerability databases from; in an air-gapped cluster point both at the internal mirror |
| `TRIVY_INSECURE` (v0.72+) | unset | `true` has registry scans verify no certificate, neither the database mirror's nor the scanned registry's. For a mirror with a certificate Trivy cannot be made to trust |

:::note
The database is only as current as the copy in the internal registry, so schedule regular updates of the mirror. The operator's own image and the registries your workloads use need the same treatment; for private registries and credentials, see the [Trivy Operator documentation](https://aquasecurity.github.io/trivy-operator/).
:::
