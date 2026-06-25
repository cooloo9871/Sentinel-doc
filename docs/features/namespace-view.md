---
id: namespace-view
title: Tetragon Agents 狀態
sidebar_position: 9
---

# Tetragon Agents 狀態

## 功能說明

Tetragon Agents 頁面提供叢集中每個 Kubernetes Node 上 Tetragon Agent Pod 的即時健康狀態監控。透過此頁面，維運人員可快速確認各節點的 Tetragon 是否正常運作，並掌握重啟次數等穩定性指標。

---

## 查看 Tetragon Agents 狀態

進入「**Cluster → Tetragon Agents**」頁面後，會顯示整體統計與各節點的詳細狀態。

![Tetragon Agents 頁面](/img/features/namespace/tetragon.png)

**整體統計卡片：**

| 卡片 | 說明 |
|---|---|
| **Healthy** | 目前正常運行中的 Tetragon Agent Pod 數量（綠色數字） |
| **Unhealthy** | 目前處於異常狀態的 Tetragon Agent Pod 數量（例如 CrashLoopBackOff、OOMKilled） |
| **Total Agents** | 叢集中 Tetragon DaemonSet 管理的 Pod 總數（通常等於 Worker Node 數量） |

---

## 各 Agent 卡片說明

每個 Node 上的 Tetragon Agent 以獨立卡片呈現，顯示以下資訊：

| 欄位 | 說明 |
|---|---|
| **Node 名稱** | 此 Agent 所在的 Kubernetes Node 名稱，右上角顯示健康狀態徽章（`Healthy` / `Unhealthy`） |
| **Pod** | Tetragon DaemonSet 在該 Node 上建立的 Pod 縮短名稱 |
| **Restarts** | Pod 自部署以來的重啟次數；數值若以橙色顯示，代表有重啟紀錄需留意 |
| **Started** | Pod 最近一次成功啟動的時間戳記 |

頁面右上角顯示資料最後更新時間，點擊「**Refresh**」可手動重新查詢最新狀態。

---

## 重要說明

Tetragon 以 **DaemonSet** 形式部署，每個 Node 都必須有一個正常運行的 Agent，才能確保該節點上所有 Pod 的安全事件皆能被捕捉與處理。

若某個 Node 的 Tetragon Agent Pod 處於 **Unhealthy** 狀態：
- 該節點上所有 Pod 的安全事件將**無法被偵測**
- TracingPolicy 的 Protect 模式對該節點的 Pod **將失效**，形成安全防護缺口

建議定期檢查此頁面，確保所有 Agents 皆維持 Healthy 狀態。
