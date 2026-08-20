---
id: cilium-install
title: 安裝與設定 Cilium
sidebar_position: 2
---

# 安裝與設定 Cilium

Sentinel 依賴 **Cilium** 作為叢集的 CNI，並且需要啟用特定功能才能讓所有模組正常運作：

| Sentinel 功能 | 依賴的 Cilium 能力 |
|---|---|
| **Network Topology** | Hubble 流量觀測（含 L7），Sentinel 透過 **Hubble Relay** 的 gRPC 串流讀取全叢集彙整後的 flow |
| **Network Policy** | `CiliumNetworkPolicy` / `CiliumClusterwideNetworkPolicy` CRD 與資料平面強制執行 |
| **Quarantine** | 以 Cilium 叢集層級 Policy（`sentinel-quarantine`）實現 Pod 網路隔離 |
| **Tetragon** | Tetragon 為 Cilium 生態系的 eBPF 安全觀測元件，與 Cilium 共用基礎環境 |

---

## 步驟一：安裝 Cilium CLI

在可存取叢集的機器上安裝 [Cilium CLI](https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/)：

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

## 步驟二：安裝 Cilium

執行以下指令將 Cilium 部署至叢集（請將 `<api-server-ip>` 替換為 kube-apiserver 的位址）：

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

**各參數說明：**

| 參數 | 說明 |
|---|---|
| `hubble.enabled=true` | **Sentinel 必要**：開啟 Hubble 流量觀測，是 Network Topology 與 Cilium Policy 拒絕事件唯一的資料來源 |
| `hubble.relay.enabled=true` | **Sentinel 必要（v0.43+）**：部署 **Hubble Relay**，將所有節點的 flow 彙整在單一 gRPC 端點後面。Sentinel 直接連線 `hubble-relay` 讀取，不再逐一連各節點的 agent；沒有 Relay 就沒有可讀的彙整流量來源 |
| `kubeProxyReplacement=true` | **Sentinel 必要**：Cilium 的 socket 層負載平衡會在流量被觀測**之前**將 Service 位址改寫為實際的 backend Pod，拓撲看到的才是真正的 Endpoint。若交給 kube-proxy，flow 會帶著 ClusterIP，Sentinel 會捨棄該連線（VIP 不是 Endpoint） |
| `k8sServiceHost` / `k8sServicePort` | Cilium 自身需要：kube-proxy 移除後，agent 無法再透過 Service VIP 連 kube-apiserver，需直連（kubeadm 預設 `6443`） |
| `rollOutCiliumPods=true` / `operator.rollOutPods=true` | 與 Sentinel 無關，但建議加上：設定變更時自動滾動重啟 agent 與 operator，`cilium upgrade` 不需手動 rollout |

:::note Hubble UI 不需要安裝
Sentinel 本身就是 UI：**Relay 必要，但 Hubble UI 不需要**。除 correlation 參數外的 `hubble.metrics` 也不需要，Sentinel 不抓取 Hubble metrics。
:::

**建議加上的參數：**

```bash
  --set hubble.metrics.enableNetworkPolicyCorrelation=true
```

啟用後，Hubble 在回報被拒絕的流量時會直接標明是**哪一條** Policy 擋下的（`egress_denied_by` / `ingress_denied_by`）。非必要（未啟用時 Sentinel 會改以「哪些 Policy 管轄該 Pod 該方向」推論），但 correlation 是權威答案，推論可能列出多個候選。注意其限制：correlation 只對**明確的** `ingressDeny` / `egressDeny` 規則有效；Whitelist 是以「缺少 allow 規則」達成拒絕，沒有規則可回報，一律走推論。若你的 Policy 以 Whitelist 為主，此參數幫助有限。

:::note
若叢集已安裝 Cilium 但缺少上述設定（最常見的是升級 Sentinel v0.43+ 時需補開 Hubble Relay），可用 `cilium upgrade --set <參數>` 或 Helm 補上：

```bash
helm upgrade cilium cilium/cilium -n kube-system --reuse-values \
  --set hubble.relay.enabled=true
```

再等待 Cilium Pod 滾動更新完成。
:::

---

## 步驟三：驗證安裝

等待所有元件就緒：

```bash
cilium status --wait
```

預期 `Cilium`、`Operator`、`Hubble Relay` 皆顯示 `OK`。接著確認：

```bash
# Cilium DaemonSet 於每個節點正常運行
kubectl get pods -n kube-system -l k8s-app=cilium

# Hubble Relay 正常運行（Sentinel 讀取 flow 的來源）
kubectl get pods -n kube-system -l k8s-app=hubble-relay

# kube-proxy replacement 已啟用
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep KubeProxyReplacement

# Network Policy 所需的 CRD 已註冊
kubectl get crd | grep cilium.io
```

`kubectl get crd` 輸出應包含 `ciliumnetworkpolicies.cilium.io` 與 `ciliumclusterwidenetworkpolicies.cilium.io`，這是 Sentinel Network Policy 功能運作的前提。

:::tip
Sentinel 預設假設 Cilium 安裝於 `kube-system` Namespace。若您安裝於其他 Namespace，部署 Sentinel 時需將環境變數 `CILIUM_NAMESPACE` 設為對應值。
:::
