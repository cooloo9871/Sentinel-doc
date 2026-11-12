---
id: index
title: Installation Overview
sidebar_position: 1
---

# Installation Overview

K8s Sentinel offers two installation methods. Choose the one that best fits your use case.

## Comparison

| Method | Use Case | Requirements | Advantages |
|---|---|---|---|
| **Kubernetes Job** | Production / CI pipelines | kubectl access | Automated, no manual steps |
| **Local Script (install.sh)** | Quick evaluation / development | bash + kubectl | Visible steps, easy to observe |

## Common Prerequisites

Regardless of installation method, confirm the following before starting:

- Kubernetes cluster is running (version 1.32+)
- `kubectl` is installed and configured with cluster-admin permissions
- Cilium is deployed with kube-proxy replacement and Hubble enabled (see [Installing and Configuring Cilium](./cilium-install.md))
- Tetragon is installed (see [Installing Tetragon](./tetragon-install.md))

Complete all checks in the [Prerequisites](../prerequisites.md) page before proceeding.

:::caution[Upgrading from before v0.43?]
Since v0.43, runtime events are collected over gRPC (no more `kubectl exec`). Existing clusters need three things before upgrading:

1. **Expose Tetragon's gRPC**: `kubectl -n kube-system patch cm tetragon-config --type merge -p '{"data":{"server-address":"0.0.0.0:54321"}}'` then `rollout restart ds/tetragon` (see [Installing Tetragon](./tetragon-install.md))
2. **Enable Hubble Relay on Cilium**: `--set hubble.relay.enabled=true` (see [Installing and Configuring Cilium](./cilium-install.md))
3. **Re-apply the ClusterRole**: `kubectl apply -f deploy/sentinel.yaml` - the new version drops `pods/exec` (the largest privilege K8s Sentinel held) and adds read access to the resources exposure detection needs

Fresh installs (install-job / install.sh) handle all of this automatically.
:::

:::caution[Upgrading to v0.64+]
- **Everyone is signed out once**: since v0.64 a session is refused after its account is deleted or its password changes
- Creating a Tracing Policy under a **name that already exists** is refused instead of replacing the existing policy
- Re-apply `deploy/sentinel.yaml` to drop the unused cluster-wide `pods/log` permission (optional)
:::

:::caution[Upgrading to v0.60+ (vulnerability scanning)]
- **Re-apply `deploy/sentinel.yaml`**: the ClusterRole adds read-only rules for `vulnerabilityreports` and `jobs` (v0.60), plus a Role in `sentinel-system` used by registry scanning (v0.62)
- **Trivy Operator**: it is not installed automatically on existing environments; see [Installing Trivy Operator](./trivy-operator.md) for how to install and upgrade it
:::

After installation:

- **For production, set up [Persistent Storage (PV / PVC)](./persistent-storage.md) first** - the default `emptyDir` wipes all accounts, rules and event data whenever the Pod restarts
- Both installation methods also install Trivy Operator (v0.61+); if you only apply `deploy/sentinel.yaml`, or want to know about the setup for air-gapped environments, see [Installing Trivy Operator](./trivy-operator.md)
- If you plan to use the Admission Events feature, also complete [Wiring Up the API Server Audit Log](./audit-webhook.md)

## Recommendation

:::tip[Which method should I use?]
- **Production environments**: Use [Kubernetes Job Installation](./job-install.md). The Job runs inside the cluster, ensuring network consistency and making it easy to audit and integrate with automation.
- **Quick evaluation or development**: Use [Local Script Installation](./script-install.md). The script prints installation progress step by step, making it easy to observe and debug.
:::
