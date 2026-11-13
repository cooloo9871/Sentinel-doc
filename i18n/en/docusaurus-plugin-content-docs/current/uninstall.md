---
id: uninstall
title: Uninstall
sidebar_position: 17
---

:::warning
Uninstalling deletes everything in the `sentinel-system` namespace, including settings, user accounts and stored events. Make sure to back up any necessary data before proceeding.
:::

## Using uninstall.sh (recommended, v0.64.1+)

`deploy/uninstall.sh` removes everything that `deploy/install.sh` and `deploy/install-job.yaml` installed. Run it from the K8s Sentinel source directory (after an [offline installation](./installation/offline-install.md), use the `uninstall.sh` in the bundle):

```bash
bash deploy/uninstall.sh --dry-run   # only lists what would be removed
bash deploy/uninstall.sh             # asks, then removes
```

What it removes:

- K8s Sentinel and the `sentinel-system` namespace (settings, accounts and stored events included)
- Trivy Operator with its Trivy server
- Tetragon (including the NetworkPolicy `tetragon-grpc`)
- What the installer Job left in `kube-system`
- The object K8s Sentinel keeps its scan results in, `sentinel-vulnerability-gate` (since v0.69 removed only after K8s Sentinel is gone)
- **The quarantine policy and the quarantine labels on Pods**: a pod left isolated with no K8s Sentinel to release it would stay that way

| Option | Effect |
|---|---|
| `--dry-run` | Lists what would be deleted and deletes nothing |
| `--keep-tetragon` | Leaves Tetragon alone, for a cluster where it was installed before K8s Sentinel. Since v0.69 the NetworkPolicy `tetragon-grpc` is still removed: it admits only K8s Sentinel, so left behind it would let nobody in. Tetragon's gRPC API is then no longer limited, and it has no authentication of its own |
| `--purge` | Also deletes the Tracing, Network and Admission Policies made or edited in K8s Sentinel, every vulnerability report, and the Tetragon and Trivy CRDs |
| `--yes` | Does not ask |

Set the `TETRAGON_NAMESPACE` environment variable if Tetragon is not in `kube-system`.

:::note[Components K8s Sentinel did not install are left alone]
Since v0.69, a Trivy Operator outside `sentinel-system`, or a Tetragon outside `kube-system` (or `TETRAGON_NAMESPACE`), is taken as not installed by K8s Sentinel and is left alone with its cluster-wide objects, reports and CRDs, even with `--purge`.
:::

## What Stays Without --purge

:::info
Without `--purge`, the policies made in K8s Sentinel stay and **go on being enforced**: Network Policies by Cilium, Admission Policies by the API server. Tracing Policies are kept as objects but do nothing once Tetragon is gone. Vulnerability reports and the CRDs stay too.
:::

:::warning[Admission policies that go by scan results admit everything]
Admission policies made with the **Vulnerability Limit** and **Blocked CVEs** rules are the exception: the scan results they go by are removed, so they **admit everything** from the uninstall on. See [Refusing Vulnerable Images](./features/vulnerability-admission.md).
:::

To clean them up manually later, list and delete them:

```bash
kubectl get tracingpolicy,tracingpolicynamespaced --all-namespaces
kubectl delete tracingpolicynamespaced <name> -n <namespace>
kubectl delete tracingpolicy <name>
```

## Persistent Data

For a PersistentVolume you added for K8s Sentinel's data, the claim is deleted with the namespace, and whether the data itself is kept depends on the volume's reclaim policy. With hostPath or a Local Volume, delete the data directory on the node manually:

```bash
sudo rm -rf /data/sentinel/
```

> Double-check the path before running `sudo rm -rf`. This cannot be undone.
