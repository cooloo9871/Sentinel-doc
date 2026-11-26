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

## Upgrading to v0.82

Upgrading from v0.81 needs only the new image: no manifest to re-apply and no data migration. Behaviour changes as follows:

- **Roles of your own**: existing Admin and Viewer accounts need no change. Roles made here are kept in `roles.json` in the data directory and need [Persistent Storage](./persistent-storage.md) to survive a restart, see [Roles and Permissions](../features/roles.md)
- **Every API route checks the role for reads as well**: the built-in Viewer can no longer read `GET /api/alerts`, `GET /api/rsyslog` or `GET /api/settings/session-ttl` directly
- The `sentinel-quarantine` policy that isolates quarantined pods is read-only in the Network Policy list (v0.82.1)

When upgrading from a release before v0.81, re-apply `deploy/sentinel.yaml`, restart K8s Sentinel, and make sure Tetragon, Cilium (Hubble Relay) and Trivy Operator are set up as the pages of this chapter describe. For the upgrade notes of another release, switch to that version's docs with the version menu at the top of the page.

```bash
kubectl apply -f deploy/sentinel.yaml
kubectl -n sentinel-system rollout restart deployment/sentinel
```

:::caution[Re-applying deploy/sentinel.yaml puts back what the file says]
If you changed the Deployment or the Service **by editing that file** (a PVC in place of the `emptyDir`, `AUDIT_WEBHOOK_TOKEN`, a pinned image tag, a `NodePort`), carry those edits into the new file first, or apply your own copy.

Applied as it comes, the data volume goes back to `emptyDir`, which is an empty K8s Sentinel with only the `admin` / `admin` account, and an audit webhook token set in the file is dropped. Changes made with `kubectl set env` or `kubectl patch`, and a `clusterIP` you chose, are kept.
:::
