---
id: job-install
title: Kubernetes Job Installation
sidebar_position: 2
---

# Kubernetes Job Installation

## How It Works

A Kubernetes Job (`sentinel-installer`, in **`kube-system`**) performs the installation inside the cluster: no git, helm or anything else needed locally, only `kubectl`. The Job runs three steps in order:

1. **Tetragon**: skipped if a `tetragon` DaemonSet already exists; otherwise installed via Helm with `tetragon.grpc.address=0.0.0.0:54321` (required for K8s Sentinel's event collection), waiting for the DaemonSet to become ready
   Since v0.64.1 it also sets `hostNetwork=false` and applies `deploy/tetragon-grpc-policy.yaml`, so that only K8s Sentinel can reach the Tetragon gRPC port (see [Installing Tetragon](./tetragon-install.md) for the reason); this has no effect on a Tetragon that was already installed on the host network
2. **K8s Sentinel**: applies `deploy/sentinel.yaml` straight from GitHub (Namespace, RBAC, Deployment and Service in one file, no Kustomize), waiting for the Deployment to become ready
3. **Trivy Operator** (v0.61+): skipped if a Trivy Operator Deployment already exists in any namespace of the cluster; otherwise installed via Helm into `sentinel-system` (release name `trivy-operator`) with `deploy/trivy-operator-values.yaml`. This step comes last, so even if it fails K8s Sentinel itself is already installed (see [Installing Trivy Operator](./trivy-operator.md))

The whole procedure runs inside the cluster with no dependency on the local machine, which suits CI/CD pipelines and environments where a local bash cannot be used.

:::note[Prerequisites]
- The Job runs in-cluster and needs egress to `helm.cilium.io`, `raw.githubusercontent.com`, `aquasecurity.github.io` and `github.com`
- The installer runs with `cluster-admin` (needed to create the Namespace and ClusterRole); its ServiceAccount lives in `kube-system`
:::

---

## Step 1: Apply install-job.yaml

**Action**: create the installer Job straight from the source URL, no clone required

```bash
kubectl apply -f https://raw.githubusercontent.com/cooloo9871/K8s_Sentinel/main/deploy/install-job.yaml
```

**How it works**: this creates three resources, all in **`kube-system`**: the `sentinel-installer` ServiceAccount, a ClusterRoleBinding to `cluster-admin`, and the `sentinel-installer` Job. The Job starts a Pod that installs from inside the cluster, so the network environment is consistent and unaffected by local firewalls or proxies.

---

## Step 2: Follow the Progress and Confirm Completion

```bash
# Follow the installer log live
kubectl logs -n kube-system job/sentinel-installer -f

# Confirm the Job completed
kubectl get jobs -n kube-system
```

**How it works**: `COMPLETIONS` shows `1/1` once the Job succeeds. The log prints the three phases in order: `[1/3] Tetragon`, `[2/3] Deploying K8s Sentinel` and `[3/3] Trivy Operator`.

Expected output:

```
NAME                 COMPLETIONS   DURATION   AGE
sentinel-installer   1/1           45s        2m
```

:::note
The Job's Pod carries `ttlSecondsAfterFinished: 600`, so it is deleted automatically 10 minutes after completion and the log is no longer viewable after that. This is expected.
:::

---

## Step 3: Confirm K8s Sentinel Is Ready

K8s Sentinel itself is installed into the **`sentinel-system`** namespace (only the installer Job lives in `kube-system`):

```bash
kubectl get pods -n sentinel-system
kubectl get svc -n sentinel-system
```

**Expected output**:

- The `sentinel-XXXX` Pod is `Running`
- When the installer Job installed Trivy Operator, you will also see the `trivy-operator` and `trivy-server` Pods; the batch of `scan-vulnerabilityreport-*` Pods that appears right after installation is the first scan pass, and they are removed automatically as they finish
- Service `sentinel` is created, showing a ClusterIP

```
NAME                        READY   STATUS    RESTARTS   AGE
sentinel-7d9f8b6c4-xxxxx    1/1     Running   0          3m

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
sentinel        ClusterIP   10.96.123.45    <none>        80/TCP     3m
```

If the Pod is `Pending` or `CrashLoopBackOff`, use `kubectl describe pod <pod-name> -n sentinel-system` to inspect the events.

---

:::note[The Job always installs what is on the main branch]
The Job fetches `deploy/sentinel.yaml` and `deploy/trivy-operator-values.yaml` from GitHub and does not read your local clone. To install a pinned version or edited manifests, use the [local script installation](./script-install.md) or apply the manifest directly.
:::

---

## Cleaning Up the Installer Job (Optional)

Since v0.64 the installer Job **removes** its `cluster-admin` ClusterRoleBinding itself as its last step, so no ServiceAccount is left holding cluster-admin in `kube-system`; the Job itself is deleted ten minutes after it finishes. To remove the remaining ServiceAccount as well, run (this does not affect the installed K8s Sentinel):

```bash
kubectl delete -f https://raw.githubusercontent.com/cooloo9871/K8s_Sentinel/main/deploy/install-job.yaml
```

---

:::info[Persistent storage]
The bundled deployment uses `emptyDir`, so accounts, rules and event data reset when the Pod restarts. For production, continue with [Persistent Storage (PV / PVC)](./persistent-storage.md).
:::
