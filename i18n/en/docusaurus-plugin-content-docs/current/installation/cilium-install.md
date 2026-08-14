---
id: cilium-install
title: Installing and Configuring Cilium
sidebar_position: 2
---

# Installing and Configuring Cilium

Sentinel relies on **Cilium** as the cluster CNI, and several Sentinel modules require specific Cilium features to be enabled:

| Sentinel feature | Required Cilium capability |
|---|---|
| **Network Topology** | Hubble observability (including L7 traffic info) — Sentinel reads actual Pod-to-Pod connections from Hubble |
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
  --set rollOutCiliumPods=true \
  --set operator.rollOutPods=true
```

**What each flag does:**

| Flag | Description |
|---|---|
| `kubeProxyReplacement=true` | Replaces kube-proxy with Cilium eBPF. **Required by Sentinel**: with it, Hubble observes real Pod endpoints instead of ClusterIP addresses, so Network Topology can render actual Pod-to-Pod connections |
| `k8sServiceHost` / `k8sServicePort` | In kube-proxy replacement mode, Cilium must reach the kube-apiserver directly (kubeadm default port `6443`) |
| `hubble.enabled=true` | Opens the Hubble observation socket. **Required by Sentinel**: Network Topology's connection data comes from Hubble's traffic observation |
| `rollOutCiliumPods=true` / `operator.rollOutPods=true` | Automatically roll Cilium Pods on config changes so new settings take effect immediately |

**Recommended addition:**

```bash
  --set hubble.metrics.enableNetworkPolicyCorrelation=true
```

With this enabled, Hubble attributes denied flows to the Network Policy that caused them, making it much easier to pinpoint which policy blocked a connection.

:::note
If Cilium is already installed but missing these settings, add them with `cilium upgrade --set <flag>` or Helm: `helm upgrade cilium cilium/cilium -n kube-system --reuse-values --set <flag>`, then wait for the Cilium Pods to roll.
:::

---

## Step 3: Verify

Wait for all components to become ready:

```bash
cilium status --wait
```

`Cilium`, `Operator`, and `Hubble Relay` (if installed) should all report `OK`. Then confirm:

```bash
# Cilium DaemonSet running on every node
kubectl get pods -n kube-system -l k8s-app=cilium

# kube-proxy replacement is active
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep KubeProxyReplacement

# CRDs needed by the Network Policy feature are registered
kubectl get crd | grep cilium.io
```

The `kubectl get crd` output should include `ciliumnetworkpolicies.cilium.io` and `ciliumclusterwidenetworkpolicies.cilium.io` — a prerequisite for Sentinel's Network Policy feature.

:::tip
Sentinel assumes Cilium is installed in the `kube-system` namespace by default. If you installed it elsewhere, set the `CILIUM_NAMESPACE` environment variable accordingly when deploying Sentinel.
:::
