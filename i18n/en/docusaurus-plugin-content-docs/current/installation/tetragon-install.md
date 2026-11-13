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
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

- **`tetragon.grpc.address=0.0.0.0:54321`** is required: K8s Sentinel (v0.43+) collects runtime events over the Tetragon gRPC API, and the agent's default bind is `localhost:54321`, reachable only from inside the pod
- **`hostNetwork=false` and the NetworkPolicy** (how it is installed since v0.64.1) are what keep that API to K8s Sentinel. Tetragon's gRPC server has **no authentication and no TLS**: whoever can connect reads every process started on the node, command line included, and can list, disable or delete tracing policies. On the host network, which is the chart's default, the port is open on every node's address to every pod in the cluster, and a NetworkPolicy does not apply to a hostNetwork pod; off the host network it is an ordinary pod port, and `deploy/tetragon-grpc-policy.yaml` (NetworkPolicy `tetragon-grpc`) admits only the K8s Sentinel pod. A NetworkPolicy governs traffic between pods: a process on the node itself, or a pod on the host network of that node, can still reach the port. Edit the namespaces in that file if Tetragon or K8s Sentinel is installed elsewhere

Everything else can stay at defaults: the Kubernetes metadata enrichment K8s Sentinel needs (associating events with Pods / Namespaces / Containers, `tetragon.enableK8sAPIAccess`) is enabled by default. `deploy/install-job.yaml` and `deploy/install.sh` do all of this for you.

:::note
Off the host network Tetragon starts once the node's CNI is up, so the first seconds of a node's boot are not observed.
:::

### Moving an existing Tetragon off the host network

The installers skip Tetragon when its DaemonSet is already present (looked for in every namespace since v0.69, not only `kube-system`), so one installed earlier is still on the host network with its gRPC port open to the cluster.

Installed as a Helm release (`helm list -n kube-system` shows `tetragon`):

```bash
helm upgrade tetragon cilium/tetragon -n kube-system --reset-then-reuse-values \
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

Installed by a `deploy/install.sh` from v0.64.0 or earlier (which applied rendered templates and left no release):

```bash
helm template tetragon cilium/tetragon -n kube-system \
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321 | kubectl apply -f -
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

K8s Sentinel finds the agents at their new addresses by itself within half a minute. To check, from any other pod: `nc -zv <tetragon pod IP> 54321` must time out.

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
