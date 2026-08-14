---
id: tetragon-install
title: Installing Tetragon
sidebar_position: 3
---

# Installing Tetragon

**Tetragon** is the eBPF-based security observability and enforcement component of the Cilium ecosystem. It runs as a DaemonSet on every node and captures process executions and file access at the kernel level. Sentinel's core features — TracingPolicy management, Security Events, and Behavior Discovery — are all built on Tetragon.

:::note
Complete the [Cilium installation and configuration](./cilium-install.md) before installing Tetragon.
:::

---

## Step 1: Install with Helm

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
helm install tetragon cilium/tetragon -n kube-system
```

The default values are sufficient — the Kubernetes metadata enrichment Sentinel needs (associating events with Pods / Namespaces / Containers) is enabled by default.

:::tip
Sentinel assumes Tetragon is installed in the `kube-system` namespace by default. If you install it elsewhere (e.g. `-n tetragon`), set the `TETRAGON_NAMESPACE` environment variable accordingly when deploying Sentinel.
:::

---

## Step 2: Verify

Confirm there is one `Running` Tetragon Pod per node:

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon -o wide
```

Confirm the TracingPolicy CRDs are registered:

```bash
kubectl get crd | grep tetragon
```

Expected output includes:

- `tracingpolicies.cilium.io`
- `tracingpoliciesnamespaced.cilium.io`

(Optional) Watch the live event stream with the `tetra` CLI to confirm the eBPF sensors are working:

```bash
kubectl exec -it -n kube-system ds/tetragon -c tetragon -- \
  tetra getevents -o compact
```

A continuous stream of process events from the cluster means Tetragon is capturing correctly.

---

## Integration with Sentinel

Once Sentinel is deployed:

- The "**Cluster → Tetragon Agents**" page shows each node agent's health and restart count
- "**Behavior Discovery**" immediately starts accumulating workload behavior observations via the Tetragon base sensor
- Policies created in "**Tracing Policy**" are loaded by the Tetragon Agents within seconds

:::info
Upgrade Tetragon with `helm upgrade tetragon cilium/tetragon -n kube-system`. Agents roll node by node during the upgrade; a briefly offline node may temporarily show as Unhealthy on Sentinel's Tetragon Agents page — this is expected.
:::
