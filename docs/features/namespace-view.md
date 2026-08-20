---
id: namespace-view
title: 事件來源（Event Sources）
sidebar_position: 9
---

# 事件來源（Event Sources）

## 功能說明

Event Sources 頁面（v0.49 起，由原「Tetragon Agents」頁擴充改名）回答一個安全主控台最關鍵的問題：**K8s Sentinel 現在真的收得到事件嗎？** 頁面同時呈現兩個事件來源的即時狀態：每個節點的 Tetragon Agent，以及 Hubble Relay。

Pod 的 Kubernetes readiness 只能說明 Agent 活著，**不代表事件串流是通的**：NetworkPolicy 擋住、gRPC 位址設錯、TLS 不符，都會讓 Agent 看似健康卻一筆事件也進不來。本頁顯示的是**串流連線的真實狀態**，避免「看起來在監控、實際上是瞎的」這種最糟的失效模式。

---

## 查看 Event Sources

進入「**Cluster → Event Sources**」頁面：

![Event Sources 頁面](/img/features/namespace/event-sources.png)

### Tetragon agents 區塊

**整體統計卡片**：`Healthy` / `Unhealthy` / `Total Agents`（Tetragon 以 DaemonSet 部署，總數通常等於節點數）。

**各節點卡片欄位**：

| 欄位 | 說明 |
|---|---|
| **Node 名稱** | Agent 所在節點，右上角顯示健康徽章（`Healthy` / `Unhealthy` / `Stream Down`） |
| **Pod** | 該節點上的 Tetragon Pod 名稱 |
| **Restarts** | Pod 重啟次數；有重啟紀錄時以橙色顯示 |
| **Ingestion** | **事件串流狀態**：`Connected` 代表 K8s Sentinel 與此 Agent 的 gRPC 串流正常；`Stream Down`（紅色）代表 Pod 雖 Ready 但串流中斷，並顯示連續失敗次數與最後錯誤訊息 |
| **Last event** | 最後一筆事件實際抵達的時間（僅供參考，健康與否取決於**連線活性**而非事件量，安靜的叢集不會被誤判為故障） |
| **Started** | Pod 最近一次啟動時間 |

### Hubble 區塊

顯示 **Hubble Relay** 的連線狀態卡片：連線狀態、最後一筆 flow 的時間、連續失敗次數與最後錯誤。這是 Network Topology 的資料來源。

叢集未安裝 Cilium 時，此區塊顯示中性的「Not detected」，那是組態事實，不是故障，不會以紅色警示呈現。

---

## 串流異常時的行為

- **任一串流中斷時，Dashboard 會立即出現紅色警示 banner**，Tetragon 統計卡片反映的也是串流狀態而非單純的 Pod readiness
- 任一節點的串流結束會觸發**全面重連**（v0.50+），修復「單一節點斷線後永遠不再重撥」的問題；已下線縮編的節點會自動從清單移除
- 串流恢復後，該來源的失敗計數自動歸零
- 程式化存取：`GET /api/ingestion/health` 回傳所有來源的即時狀態

:::warning
某節點顯示 `Stream Down` 或 `Unhealthy` 時，該節點上所有 Pod 的安全事件**無法被偵測**，TracingPolicy 的 Protect 模式對該節點**也會失效**，形成防護缺口。請優先排查：Tetragon gRPC 位址（`0.0.0.0:54321`，見[安裝 Tetragon](../installation/tetragon-install.md)）、NetworkPolicy 是否擋住 K8s Sentinel 到節點的連線、TLS 設定是否相符。
:::
