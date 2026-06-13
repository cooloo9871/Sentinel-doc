---
id: namespace-view
title: Namespace 與叢集資訊
sidebar_position: 9
---

# Namespace 與叢集資訊

## 功能說明

Namespace 與叢集資訊頁面提供兩項重要的叢集狀態總覽：一是各 Namespace 的 TracingPolicy 配置分佈，二是每個 Node 上 Tetragon Agent 的健康狀態。透過此頁面，維運人員可快速確認安全策略的覆蓋範圍，並即時掌握 Tetragon 各節點的運行狀況。

---

## Namespace 列表

Namespace 列表顯示叢集內所有 Namespace 及其對應的 TracingPolicy 配置情況。

![Namespaces 列表](/img/features/namespace/view.png)

**列表欄位說明：**

- **Namespace**：Kubernetes Namespace 名稱
- **TracingPolicy 數量**：該 Namespace 下目前已套用的 Namespace-scoped TracingPolicy 數量
- **狀態**：Namespace 是否處於受管理狀態

**運作原理：** Sentinel 後端透過 Kubernetes API Server 的 List API 查詢叢集內所有 Namespace，並同時統計每個 Namespace 下已存在的 TracingPolicyNamespaced 資源數量，將兩者關聯後呈現於列表中。頁面會定期自動刷新，確保數據反映最新的叢集狀態。

---

## Tetragon Agents 健康狀態

Tetragon 以 **DaemonSet** 形式部署於 Kubernetes 叢集，確保每個 Worker Node 上各運行一個 Tetragon Agent Pod，負責在該節點的 Kernel 層攔截並處理安全事件。Agents 健康狀態區塊顯示每個 Node 上 Agent 的即時運行狀況。

![Tetragon Agents 健康狀態](/img/features/namespace/tetragon.png)

**整體統計說明：**

| 統計項目 | 說明 |
|---|---|
| **Total Agents** | 叢集中 Tetragon DaemonSet 管理的 Pod 總數（通常等於 Worker Node 數量） |
| **Healthy** | 目前正常運行中的 Tetragon Agent Pod 數量 |
| **Unhealthy** | 目前處於異常狀態的 Tetragon Agent Pod 數量（例如 CrashLoopBackOff、OOMKilled 等） |

**各 Agent 卡片顯示資訊：**

每個 Agent 以獨立卡片呈現，包含以下詳細資訊：

- **Node 名稱**：此 Agent 所在的 Kubernetes Node 名稱
- **Pod 名稱**：Tetragon DaemonSet 在該 Node 上建立的 Pod 完整名稱
- **Restarts**：Pod 自部署以來的重啟次數；重啟次數偏高可能代表 Agent 存在穩定性問題
- **啟動時間**：Pod 最近一次成功啟動的時間戳記

**重要說明：** Tetragon 以 DaemonSet 形式部署，意味著每個 Node 都必須有一個正常運行的 Agent，才能確保該 Node 上所有 Pod 的安全事件皆能被捕捉與處理。若某個 Node 的 Tetragon Agent Pod 處於異常狀態（顯示為 Unhealthy），則該 Node 上的所有安全事件將無法被偵測，TracingPolicy 的 Protect 模式對該節點的 Pod 也會失效，形成安全防護缺口。建議定期檢查此頁面，確保所有 Agents 皆維持 Healthy 狀態。
