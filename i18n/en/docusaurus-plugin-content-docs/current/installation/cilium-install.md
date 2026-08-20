---
id: cilium-install
title: Installing and Configuring Cilium
sidebar_position: 2
---

# Installing and Configuring Cilium

Sentinel relies on **Cilium** as the cluster CNI, and several Sentinel modules require specific Cilium features to be enabled:

| Sentinel feature | Required Cilium capability |
|---|---|
| **Network Topology** | Hubble flow observation (including L7) - Sentinel reads the cluster-wide aggregated flows from **Hubble Relay** over gRPC |
| **Network Policy** | The `CiliumNetworkPolicy` / `CiliumClusterwideNetworkPolicy` CRDs and data-plane enforcement |
| **Quarantine** | Pod network isolation is implemented with a cluster-wide Cilium policy (`sentinel-quarantine`) |
| **Tetragon** | Tetragon is the eBPF security component of the Cilium ecosystem and shares its foundation |

---

## Step 1: Install the Cilium CLI

On a machine with cluster access, install the [Cilium CLI](https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/):

```bash
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64
curl -L --fail --remote-name-all \
  https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```

---

## Step 2: Install Cilium

Deploy Cilium to the cluster (replace `<api-server-ip>` with your kube-apiserver address):

```bash
cilium install \
  --set kubeProxyReplacement=true \
  --set k8sServiceHost=<api-server-ip> \
  --set k8sServicePort=6443 \
  --set hubble.enabled=true \
  --set hubble.relay.enabled=true \
  --set rollOutCiliumPods=true \
  --set operator.rollOutPods=true
```

**What each flag does:**

| Flag | Description |
|---|---|
| `hubble.enabled=true` | **Required by Sentinel**: turns on flow observation, the only source for Network Topology and Cilium policy denials |
| `hubble.relay.enabled=true` | **Required by Sentinel (v0.43+)**: deploys **Hubble Relay**, which aggregates every node's flows behind one gRPC endpoint. Sentinel connects to `hubble-relay` rather than reaching into each agent; without Relay there is no aggregated flow source to read |
| `kubeProxyReplacement=true` | **Required by Sentinel**: Cilium's socket-level load balancer rewrites a Service address to the backend pod *before* the flow is observed, so the topology sees the real endpoint. Left to kube-proxy, the flow carries the ClusterIP and Sentinel drops that edge - a VIP is not an endpoint |
| `k8sServiceHost` / `k8sServicePort` | Required *by Cilium* once kube-proxy is gone: the agents can no longer reach the API server through a Service VIP (kubeadm default port `6443`) |
| `rollOutCiliumPods=true` / `operator.rollOutPods=true` | Nothing to do with Sentinel, but worth having: they restart the agent and operator on a config change, so a `cilium upgrade` takes effect without a manual rollout |

:::note No Hubble UI needed
Sentinel is the only UI - **Relay is required, the Hubble UI is not**. Neither are `hubble.metrics` beyond the correlation flag below; Sentinel does not scrape Hubble metrics.
:::

**Recommended addition:**

```bash
  --set hubble.metrics.enableNetworkPolicyCorrelation=true
```

With this enabled, Hubble reports *which* policy denied a flow (`egress_denied_by` / `ingress_denied_by`). It is not required - without it Sentinel infers the policy from which of yours govern that pod in that direction - but correlation is authoritative where the fallback is an inference. Note the limit: correlation only names a policy for an **explicit** `ingressDeny` / `egressDeny` rule; a whitelist denies by the *absence* of an allow rule, so the fallback is used either way. If your policies are mostly whitelists, this flag changes little.

:::note
If Cilium is already installed but missing these settings (most commonly Hubble Relay when upgrading to Sentinel v0.43+), add them with `cilium upgrade --set <flag>` or Helm:

```bash
helm upgrade cilium cilium/cilium -n kube-system --reuse-values \
  --set hubble.relay.enabled=true
```

Then wait for the Cilium Pods to roll.
:::

---

## Step 3: Verify

Wait for all components to become ready:

```bash
cilium status --wait
```

`Cilium`, `Operator`, and `Hubble Relay` should all report `OK`. Then confirm:

```bash
# Cilium DaemonSet running on every node
kubectl get pods -n kube-system -l k8s-app=cilium

# Hubble Relay running (the flow source Sentinel reads)
kubectl get pods -n kube-system -l k8s-app=hubble-relay

# kube-proxy replacement is active
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep KubeProxyReplacement

# CRDs needed by the Network Policy feature are registered
kubectl get crd | grep cilium.io
```

The `kubectl get crd` output should include `ciliumnetworkpolicies.cilium.io` and `ciliumclusterwidenetworkpolicies.cilium.io` - a prerequisite for Sentinel's Network Policy feature.

:::tip
Sentinel assumes Cilium is installed in the `kube-system` namespace by default. If you installed it elsewhere, set the `CILIUM_NAMESPACE` environment variable accordingly when deploying Sentinel.
:::
