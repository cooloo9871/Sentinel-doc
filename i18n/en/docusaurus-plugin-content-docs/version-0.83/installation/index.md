---
id: index
title: Installation Overview
sidebar_position: 1
---

# Installation Overview

K8s Sentinel offers three installation methods. Choose the one that best fits your use case.

## Comparison

| Method | Use Case | Requirements | Advantages |
|---|---|---|---|
| **Kubernetes Job** | Production / CI pipelines | kubectl access | Automated, no manual steps |
| **Local Script (install.sh)** | Quick evaluation / development | bash + kubectl | Visible steps, easy to observe |
| **Offline Installation** | The cluster has no internet access | A private registry + kubectl | No Helm and no outbound access needed on the cluster side |

## Common Prerequisites

Regardless of installation method, confirm the following before starting:

- Kubernetes cluster is running (version 1.32+)
- `kubectl` is installed and configured with cluster-admin permissions
- Cilium is deployed with kube-proxy replacement and Hubble enabled (see [Installing and Configuring Cilium](./cilium-install.md))
- Tetragon is installed (see [Installing Tetragon](./tetragon-install.md))

Complete all checks in the [Prerequisites](../prerequisites.md) page before proceeding.

After installation:

- **For production, set up [Persistent Storage (PV / PVC)](./persistent-storage.md) first** - the default `emptyDir` wipes all accounts, rules and event data whenever the Pod restarts
- All three installation methods also install Trivy Operator; if you only apply `deploy/sentinel.yaml`, see [Installing Trivy Operator](./trivy-operator.md)
- If you plan to use the Admission Events feature, also complete [Wiring Up the API Server Audit Log](./audit-webhook.md)

## Recommendation

:::tip[Which method should I use?]
- **Production environments**: Use [Kubernetes Job Installation](./job-install.md). The Job runs inside the cluster, ensuring network consistency and making it easy to audit and integrate with automation.
- **Quick evaluation or development**: Use [Local Script Installation](./script-install.md). The script prints installation progress step by step, making it easy to observe and debug.
- **A cluster with no internet access**: Use [Offline Installation](./offline-install.md). Carry the images to a private registry first, then install from the offline bundle.
:::

## Upgrading to v0.83

Upgrading from v0.82 needs only the new image: no manifest to re-apply and no data migration. Existing policies and settings are unaffected.

- **Lock to Image is new**: choose a workload whose containers may then run only the executables their images came with, see [Lock to Image](../features/image-lockdown.md). It uses the Role and RoleBinding `sentinel-tetragon-exec` already in `deploy/sentinel.yaml`; if you deleted them, it cannot read the image's executables

When upgrading from a release before v0.82, re-apply `deploy/sentinel.yaml`, restart K8s Sentinel, and make sure Tetragon, Cilium (Hubble Relay) and Trivy Operator are set up as the pages of this chapter describe. For the upgrade notes of another release, switch to that version's docs with the version menu at the top of the page.

```bash
kubectl apply -f deploy/sentinel.yaml
kubectl -n sentinel-system rollout restart deployment/sentinel
```

:::caution[Re-applying deploy/sentinel.yaml puts back what the file says]
If you changed the Deployment or the Service **by editing that file** (a PVC in place of the `emptyDir`, `AUDIT_WEBHOOK_TOKEN`, a pinned image tag, a `NodePort`), carry those edits into the new file first, or apply your own copy.

Applied as it comes, the data volume goes back to `emptyDir`, which is an empty K8s Sentinel with only the `admin` / `admin` account, and an audit webhook token set in the file is dropped. Changes made with `kubectl set env` or `kubectl patch`, and a `clusterIP` you chose, are kept.
:::
