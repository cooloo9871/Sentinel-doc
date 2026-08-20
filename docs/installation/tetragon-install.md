---
id: tetragon-install
title: 安裝 Tetragon
sidebar_position: 3
---

# 安裝 Tetragon

**Tetragon** 是 Cilium 生態系的 eBPF 安全觀測與執行元件，以 DaemonSet 形式部署於每個節點，負責在 Kernel 層捕捉行程執行與檔案存取事件。K8s Sentinel 的 TracingPolicy 管理、Security Events、Behavior Discovery 等核心功能皆以 Tetragon 為基礎。

:::note
請先完成 [Cilium 的安裝與設定](./cilium-install.md) 再安裝 Tetragon。
:::

---

## 步驟一：以 Helm 安裝

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
helm install tetragon cilium/tetragon -n kube-system \
  --set tetragon.grpc.address=0.0.0.0:54321
```

唯一必要的自訂參數是 **`tetragon.grpc.address=0.0.0.0:54321`**：K8s Sentinel（v0.43+）透過 Tetragon 的 gRPC API 收集執行期事件，而 agent 預設綁定 `localhost:54321`，只有 Pod 內部連得到；綁定到 Pod 網路後 K8s Sentinel 才能連線。其餘用預設值即可，K8s Sentinel 需要的 Kubernetes metadata enrichment（將事件關聯到 Pod / Namespace / Container，`tetragon.enableK8sAPIAccess`）預設已啟用。

:::note 既有的 Tetragon 要升級設定？
安裝器偵測到 Tetragon DaemonSet 已存在時會跳過安裝，因此不會幫舊環境補上 gRPC 設定。直接修改運行中的設定並重啟：

```bash
kubectl -n kube-system patch cm tetragon-config --type merge \
  -p '{"data":{"server-address":"0.0.0.0:54321"}}'
kubectl -n kube-system rollout restart ds/tetragon
```
:::

:::tip
K8s Sentinel 預設假設 Tetragon 安裝於 `kube-system` Namespace。若安裝於其他 Namespace（例如 `-n tetragon`），部署 K8s Sentinel 時需將環境變數 `TETRAGON_NAMESPACE` 設為對應值。
:::

---

## 步驟二：驗證安裝

確認每個節點都有一個 Tetragon Pod 且狀態為 `Running`：

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon -o wide
```

確認 TracingPolicy CRD 已註冊：

```bash
kubectl get crd | grep tetragon
```

預期輸出包含：

- `tracingpolicies.cilium.io`
- `tracingpoliciesnamespaced.cilium.io`

（選用）以 `tetra` CLI 直接觀察事件流，確認 eBPF 感測器運作正常：

```bash
kubectl exec -it -n kube-system ds/tetragon -c tetragon -- \
  tetra getevents -o compact
```

看到叢集內的 process 事件持續輸出即代表 Tetragon 已正常捕捉事件。

---

## 安裝後與 K8s Sentinel 的整合

K8s Sentinel 部署完成後：

- 「**Cluster → Event Sources**」頁面會顯示每個節點 Agent 的健康狀態、重啟次數與事件串流（Ingestion）狀態
- 「**Behavior Discovery**」會立即開始透過 Tetragon base sensor 累積各工作負載的行為觀察
- 於「**Tracing Policy**」建立的 Policy 會由 Tetragon Agent 在數秒內載入生效

:::info
升級 Tetragon 可使用 `helm upgrade tetragon cilium/tetragon -n kube-system`。升級期間各節點的 Agent 會滾動重啟，短暫離線的節點在 K8s Sentinel 的 Event Sources 頁面上可能暫時顯示為 Unhealthy 或 Stream Down，屬正常現象。
:::
