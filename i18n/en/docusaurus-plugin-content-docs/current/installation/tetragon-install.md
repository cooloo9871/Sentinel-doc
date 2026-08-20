---
id: tetragon-install
title: Installing Tetragon
sidebar_position: 3
---

# Installing Tetragon

**Tetragon** is the eBPF-based security observability and enforcement component of the Cilium ecosystem. It runs as a DaemonSet on every node and captures process executions and file access at the kernel level. K8s Sentinel's core features - TracingPolicy management, Security Events, and Behavior Discovery - are all built on Tetragon.

:::note
Complete the [Cilium installation and configuration](./cilium-install.md) before installing Tetragon.
:::

---

## Step 1: Install with Helm

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
helm install tetragon cilium/tetragon -n kube-system \
  --set tetragon.grpc.address=0.0.0.0:54321
```

The one required custom setting is **`tetragon.grpc.address=0.0.0.0:54321`**: K8s Sentinel (v0.43+) collects runtime events over the Tetragon gRPC API, and the agent's default bind is `localhost:54321` - reachable only from inside the pod. Binding it to the pod network lets K8s Sentinel connect. Everything else can stay at defaults - the Kubernetes metadata enrichment K8s Sentinel needs (associating events with Pods / Namespaces / Containers, `tetragon.enableK8sAPIAccess`) is enabled by default.

:::note Upgrading an existing Tetragon?
The installer skips Tetragon when its DaemonSet is already present, so it will not reconfigure one installed before gRPC collection. Set the address on the running config and restart:

```bash
kubectl -n kube-system patch cm tetragon-config --type merge \
  -p '{"data":{"server-address":"0.0.0.0:54321"}}'
kubectl -n kube-system rollout restart ds/tetragon
```
:::

:::tip
K8s Sentinel assumes Tetragon is installed in the `kube-system` namespace by default. If you install it elsewhere (e.g. `-n tetragon`), set the `TETRAGON_NAMESPACE` environment variable accordingly when deploying K8s Sentinel.
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

## Integration with K8s Sentinel

Once K8s Sentinel is deployed:

- The "**Cluster → Event Sources**" page shows each node agent's health, restart count and ingestion (stream) state
- "**Behavior Discovery**" immediately starts accumulating workload behavior observations via the Tetragon base sensor
- Policies created in "**Tracing Policy**" are loaded by the Tetragon Agents within seconds

:::info
Upgrade Tetragon with `helm upgrade tetragon cilium/tetragon -n kube-system`. Agents roll node by node during the upgrade; a briefly offline node may temporarily show as Unhealthy or Stream Down on K8s Sentinel's Event Sources page - this is expected.
:::
