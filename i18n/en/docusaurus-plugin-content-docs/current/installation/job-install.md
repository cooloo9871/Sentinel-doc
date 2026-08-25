---
id: job-install
title: Kubernetes Job Installation
sidebar_position: 2
---

# Kubernetes Job Installation

## How It Works

A Kubernetes Job (`sentinel-installer`, in **`kube-system`**) performs the installation inside the cluster: no git, helm or anything else needed locally, only `kubectl`. The Job runs two steps in order:

1. **Tetragon**: skipped if a `tetragon` DaemonSet already exists; otherwise installed via Helm with `tetragon.grpc.address=0.0.0.0:54321` (required for K8s Sentinel's event collection), waiting for the DaemonSet to become ready
2. **K8s Sentinel**: applies `deploy/sentinel.yaml` straight from GitHub (Namespace, RBAC, Deployment and Service in one file, no Kustomize), waiting for the Deployment to become ready

The whole procedure runs inside the cluster with no dependency on the local machine, which suits CI/CD pipelines and environments where a local bash cannot be used.

:::note[Prerequisites]
- The Job runs in-cluster and needs egress to `helm.cilium.io` and `raw.githubusercontent.com`
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

**How it works**: `COMPLETIONS` shows `1/1` once the Job succeeds. The log prints the two phases in order: `[1/2] Tetragon` and `[2/2] Deploying K8s Sentinel`.

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
- Service `sentinel` is created, showing a ClusterIP

```
NAME                        READY   STATUS    RESTARTS   AGE
sentinel-7d9f8b6c4-xxxxx    1/1     Running   0          3m

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
sentinel        ClusterIP   10.96.123.45    <none>        80/TCP     3m
```

If the Pod is `Pending` or `CrashLoopBackOff`, use `kubectl describe pod <pod-name> -n sentinel-system` to inspect the events.

---

## Cleaning Up the Installer Job (Optional)

After the installation completes, the installer Job with its ServiceAccount and ClusterRoleBinding can be removed (this does not affect the installed K8s Sentinel):

```bash
kubectl delete -f https://raw.githubusercontent.com/cooloo9871/K8s_Sentinel/main/deploy/install-job.yaml
```

---

:::info[Persistent storage]
The bundled deployment uses `emptyDir`, so accounts, rules and event data reset when the Pod restarts. For production, continue with [Persistent Storage (PV / PVC)](./persistent-storage.md).
:::
