---
id: uninstall
title: Uninstall
sidebar_position: 17
---

:::warning
Uninstalling deletes everything in the `sentinel-system` namespace, including settings, user accounts and stored events. Make sure to back up any necessary data before proceeding.
:::

## Using uninstall.sh (recommended, v0.64.1+)

`deploy/uninstall.sh` removes everything that `deploy/install.sh` and `deploy/install-job.yaml` installed. Run it from the K8s Sentinel source directory:

```bash
bash deploy/uninstall.sh --dry-run   # only lists what would be removed
bash deploy/uninstall.sh             # asks, then removes
```

What it removes:

- K8s Sentinel and the `sentinel-system` namespace (settings, accounts and stored events included)
- Trivy Operator with its Trivy server
- Tetragon (including the NetworkPolicy `tetragon-grpc`)
- What the installer Job left in `kube-system`
- **The quarantine policy and the quarantine labels on Pods**: a pod left isolated with no K8s Sentinel to release it would stay that way

| Option | Effect |
|---|---|
| `--dry-run` | Lists what would be deleted and deletes nothing |
| `--keep-tetragon` | Leaves Tetragon alone, for a cluster where it was installed before K8s Sentinel |
| `--purge` | Also deletes the Tracing, Network and Admission Policies made in K8s Sentinel, every vulnerability report, and the Tetragon and Trivy CRDs |
| `--yes` | Does not ask |

Set the `TETRAGON_NAMESPACE` environment variable if Tetragon is not in `kube-system`.

## What Stays Without --purge

:::info
Without `--purge`, the policies made in K8s Sentinel stay and **go on being enforced**: Network Policies by Cilium, Admission Policies by the API server. Tracing Policies are kept as objects but do nothing once Tetragon is gone. Vulnerability reports and the CRDs stay too.
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
