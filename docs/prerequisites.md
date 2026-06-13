---
id: prerequisites
title: 前置需求
sidebar_position: 3
---

# 前置需求

在部署 Sentinel 之前，請確認您的環境已符合以下所有需求。

## 環境需求

| 元件 | 最低版本 | 說明 |
|---|---|---|
| Kubernetes | 1.26+ | 叢集需正常運作，且能透過 kubeconfig 存取 |
| Cilium | 1.14+ | 提供 Tetragon 整合所需的網路與 eBPF 基礎環境 |
| Tetragon | 1.0+ | 以 DaemonSet 形式部署，提供 eBPF 安全監控能力 |
| kubectl | 1.26+ | 用於本機操作叢集，需已設定有效的 kubeconfig |
| 存取權限 | cluster-admin 或具 TracingPolicy RBAC | 安裝 Sentinel 及操作 TracingPolicy CRD 均需要足夠的叢集權限 |

## 確認 Cilium 安裝

執行以下指令確認 Cilium DaemonSet 已正常運行：

```bash
kubectl get pods -n kube-system -l k8s-app=cilium
```

預期所有 Pod 均顯示 `Running` 狀態，且 `READY` 欄位顯示完整就緒（例如 `1/1`）。

**原理**：Cilium 以 DaemonSet 形式部署於 Kubernetes 叢集的每個 Node 上，負責載入 eBPF 程式至 Linux kernel。確認 Pod 處於 `READY` 狀態，代表對應 Node 上的 eBPF 程式已成功載入，是 Tetragon 正常運作的基礎前提。

## 確認 Tetragon 安裝

執行以下指令確認 Tetragon DaemonSet 已正常運行（依安裝方式，命名空間可能有所不同）：

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon
# 或
kubectl get pods -n tetragon -l app.kubernetes.io/name=tetragon
```

預期輸出中每個 Node 均有對應的 Tetragon Pod，且狀態為 `Running`。

**原理**：Tetragon DaemonSet 在每個 Node 上部署一個 Agent，負責透過 eBPF hook 捕捉 kprobe 安全事件（如系統呼叫、網路連線、檔案存取），並將事件資料轉發至 Sentinel 後端進行彙整與呈現。

## 確認 kubectl 連線

確認本機 kubectl 已正確設定並能與目標叢集通訊：

```bash
kubectl cluster-info
kubectl get nodes
```

`kubectl cluster-info` 應顯示 Kubernetes control plane 的端點位址；`kubectl get nodes` 應列出叢集中所有節點，且狀態均為 `Ready`。

## 確認 TracingPolicy CRD

Tetragon 安裝完成後會自動在叢集中註冊 TracingPolicy 相關的 CRD，執行以下指令確認已存在：

```bash
kubectl get crd | grep tetragon
```

預期輸出中應包含以下兩筆 CRD 資源：

- `tracingpolicies.cilium.io`
- `tracingpoliciesnamespaced.cilium.io`

若上述 CRD 不存在，表示 Tetragon 尚未完成安裝或 CRD 未正確套用，請先完成 Tetragon 的安裝程序後再繼續。

:::tip
若您的環境尚未安裝 Tetragon，可參考 [Tetragon 官方文件](https://tetragon.io/docs/installation/kubernetes/) 使用 Helm 進行安裝。Helm 方式為目前官方推薦的 Kubernetes 部署方式，能自動處理 CRD 註冊、RBAC 設定與 DaemonSet 部署等所有前置步驟。
:::
