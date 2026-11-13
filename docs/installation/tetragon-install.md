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
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

- **`tetragon.grpc.address=0.0.0.0:54321`** 為必要設定：K8s Sentinel（v0.43+）透過 Tetragon 的 gRPC API 收集執行期事件，而 agent 預設綁定 `localhost:54321`，只有 Pod 內部連得到
- **`hostNetwork=false` 與 NetworkPolicy**（v0.64.1 起的安裝方式）用來把這個 API 限制為只有 K8s Sentinel 能連。Tetragon 的 gRPC server **沒有認證也沒有 TLS**：連得上的人就能讀到節點上每一個啟動的行程（含命令列），並能列出、停用或刪除 Tracing Policy。使用 chart 預設的 host network 時，這個埠會開在每個節點的位址上、叢集內任何 Pod 都連得到，而且 NetworkPolicy 對 hostNetwork Pod 不生效；離開 host network 後它只是一般的 Pod 埠，`deploy/tetragon-grpc-policy.yaml`（NetworkPolicy `tetragon-grpc`）只放行 K8s Sentinel 的 Pod。NetworkPolicy 管的是 Pod 之間的流量：節點本身的行程，或該節點上使用 host network 的 Pod，仍然連得到這個埠。若 Tetragon 或 K8s Sentinel 安裝在其他 Namespace，請修改該檔案中的 Namespace

其餘用預設值即可，K8s Sentinel 需要的 Kubernetes metadata enrichment（將事件關聯到 Pod / Namespace / Container，`tetragon.enableK8sAPIAccess`）預設已啟用。`deploy/install-job.yaml` 與 `deploy/install.sh` 會自動完成以上全部設定。

:::note
離開 host network 後，Tetragon 要等節點的 CNI 就緒才會啟動，因此節點開機最初幾秒的行為不會被觀測到。
:::

### 把既有的 Tetragon 移出 host network

安裝程式偵測到 Tetragon DaemonSet 已存在時會跳過安裝（v0.69 起會在所有 Namespace 中尋找，不限於 `kube-system`），因此較早安裝的 Tetragon 仍在 host network 上，gRPC 埠對整個叢集開放。

以 Helm release 安裝者（`helm list -n kube-system` 看得到 `tetragon`）：

```bash
helm upgrade tetragon cilium/tetragon -n kube-system --reset-then-reuse-values \
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

由 v0.64.0 以前的 `deploy/install.sh` 安裝者（當時是套用 render 出來的 manifest，沒有留下 release）：

```bash
helm template tetragon cilium/tetragon -n kube-system \
  --set hostNetwork=false \
  --set tetragon.grpc.address=0.0.0.0:54321 | kubectl apply -f -
kubectl apply -f deploy/tetragon-grpc-policy.yaml
```

K8s Sentinel 會在半分鐘內自行找到 agent 的新位址。驗證方式：從任一其他 Pod 執行 `nc -zv <tetragon Pod IP> 54321`，應該要逾時。

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
