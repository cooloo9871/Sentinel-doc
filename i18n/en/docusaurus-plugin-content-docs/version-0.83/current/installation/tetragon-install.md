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

- **`tetragon.grpc.address=0.0.0.0:54321`** is required: K8s Sentinel collects runtime events over the Tetragon gRPC API, and the agent's default bind is `localhost:54321`, reachable only from inside the pod
- **`hostNetwork=false` and the NetworkPolicy** are what keep that API to K8s Sentinel. Tetragon's gRPC server has **no authentication and no TLS**: whoever can connect reads every process started on the node, command line included, and can list, disable or delete tracing policies. On the host network, which is the chart's default, the port is open on every node's address to every pod in the cluster, and a NetworkPolicy does not apply to a hostNetwork pod; off the host network it is an ordinary pod port, and `deploy/tetragon-grpc-policy.yaml` (NetworkPolicy `tetragon-grpc`) admits only the K8s Sentinel pod. A NetworkPolicy governs traffic between pods: a process on the node itself, or a pod on the host network of that node, can still reach the port. Edit the namespaces in that file if Tetragon or K8s Sentinel is installed elsewhere

Everything else can stay at defaults: the Kubernetes metadata enrichment K8s Sentinel needs (associating events with Pods / Namespaces / Containers, `tetragon.enableK8sAPIAccess`) is enabled by default. `deploy/install-job.yaml` and `deploy/install.sh` do all of this for you.

:::note
Off the host network Tetragon starts once the node's CNI is up, so the first seconds of a node's boot are not observed.
:::

### Nodes on CRI-O

Nothing extra to set up: install the same way.

On CRI-O with crun, the processes of a container sit in a cgroup one level below the one named after the container, and Tetragon, which reads the pod from that name, reports every event without one. K8s Sentinel places those processes itself (from the container ID on the command line of the container runtime that started them): Tracing Policies are enforced as on any other runtime, and Behavior Discovery and Security Events name the pod. Nothing changes on containerd.

Also on CRI-O:

- Commands run through `$(...)`, a subshell or a background fork are attributed to their pod as well
- On CRI-O with runc, the runtime starting its own sealed copy (`/proc/self/fd/N`) is not listed as something the pod ran
- The commands K8s Sentinel runs inside the Tetragon agent (to learn what each process was started by) do not show up as Security Events, on every runtime

Known limit: an event may still arrive without a pod in the first seconds after K8s Sentinel starts or reconnects to an agent. Upstream measured this on CRI-O 1.37 with crun and with runc, Tetragon 1.8.0, cgroup v2.

:::warning[Leave tetragon.cri.enabled and tetragon.cgidmap.enabled off]
They are Tetragon's own answer to this, and with Tetragon 1.8.0 they place only some processes while stopping Tracing Policies that name a namespace or a pod selector from being enforced **at all**: nothing a policy says to kill is killed.

If they are on in your cluster, switch them back with the version of the chart that is installed (`helm -n kube-system list`):

```bash
helm repo update cilium
helm -n kube-system upgrade tetragon cilium/tetragon --version <installed version> --reuse-values \
  --set tetragon.cri.enabled=false \
  --set tetragon.cgidmap.enabled=false
kubectl -n kube-system rollout status daemonset/tetragon
kubectl -n sentinel-system rollout restart deployment/sentinel
```
:::

### Moving an existing Tetragon off the host network

The installers skip Tetragon when its DaemonSet is already present (looked for in every namespace, not only `kube-system`), so one installed earlier is still on the host network with its gRPC port open to the cluster.

Installed as a Helm release (`helm list -n kube-system` shows `tetragon`):

```bash
helm upgrade tetragon cilium/tetragon -n kube-system --reset-then-reuse-values \
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

Not installed as a Helm release (rendered templates were applied and left no release):

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
