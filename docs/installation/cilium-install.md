---
id: cilium-install
title: 安裝與設定 Cilium
sidebar_position: 2
---

# 安裝與設定 Cilium

Sentinel 依賴 **Cilium** 作為叢集的 CNI，並且需要啟用特定功能才能讓所有模組正常運作：

| Sentinel 功能 | 依賴的 Cilium 能力 |
|---|---|
| **Network Topology** | Hubble 觀測（含 L7 流量資訊），Sentinel 透過 Hubble 取得 Pod 之間的實際連線 |
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
  --set rollOutCiliumPods=true \
  --set operator.rollOutPods=true
```

**各參數說明：**

| 參數 | 說明 |
|---|---|
| `kubeProxyReplacement=true` | 以 Cilium eBPF 取代 kube-proxy。**Sentinel 必要**：如此 Hubble 觀測到的才是實際的 Pod Endpoint，而非 ClusterIP，Network Topology 才能正確呈現 Pod 之間的連線 |
| `k8sServiceHost` / `k8sServicePort` | kube-proxy replacement 模式下，Cilium 需直連 kube-apiserver 的位址與 Port（kubeadm 預設 `6443`） |
| `hubble.enabled=true` | 開啟 Hubble 觀測。**Sentinel 必要**：Network Topology 的連線資料即來自 Hubble 的流量觀測 |
| `rollOutCiliumPods=true` / `operator.rollOutPods=true` | 設定變更時自動滾動重啟 Cilium Pod，確保新設定即時生效 |

**建議加上的參數：**

```bash
  --set hubble.metrics.enableNetworkPolicyCorrelation=true
```

啟用後，Hubble 在回報被拒絕的流量時會附上對應的 Network Policy 名稱，方便在排查連線被擋時直接定位是哪條 Policy 造成的。

:::note
若叢集已安裝 Cilium 但缺少上述設定，可用 `cilium upgrade --set <參數>` 或 Helm `helm upgrade cilium cilium/cilium -n kube-system --reuse-values --set <參數>` 補上，再等待 Cilium Pod 滾動更新完成。
:::

---

## 步驟三：驗證安裝

等待所有元件就緒：

```bash
cilium status --wait
```

預期 `Cilium`、`Operator`、`Hubble Relay`（若有安裝）皆顯示 `OK`。接著確認：

```bash
# Cilium DaemonSet 於每個節點正常運行
kubectl get pods -n kube-system -l k8s-app=cilium

# kube-proxy replacement 已啟用
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep KubeProxyReplacement

# Network Policy 所需的 CRD 已註冊
kubectl get crd | grep cilium.io
```

`kubectl get crd` 輸出應包含 `ciliumnetworkpolicies.cilium.io` 與 `ciliumclusterwidenetworkpolicies.cilium.io`，這是 Sentinel Network Policy 功能運作的前提。

:::tip
Sentinel 預設假設 Cilium 安裝於 `kube-system` Namespace。若您安裝於其他 Namespace，部署 Sentinel 時需將環境變數 `CILIUM_NAMESPACE` 設為對應值。
:::
