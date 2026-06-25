---
id: network-topology
title: 網路拓撲（Network Topology）
sidebar_position: 10
---

# 網路拓撲（Network Topology）

## 功能說明

Network Topology 以互動式圖形介面呈現叢集內各 Pod 之間的 TCP 連線關係，資料來源為 Tetragon kprobe 捕捉到的網路事件。透過此視覺化圖形，維運人員無需解讀原始事件日誌，即可直觀掌握叢集內的實際網路流量走向，協助識別異常連線與制定精準的網路安全策略。

---

## 查看網路拓撲圖

進入「**Network Topology**」頁面後，叢集內已觀察到的 Pod 網路連線會自動以節點圖形式呈現。

![Network Topology 總覽](/img/features/network-topology/overview.png)

**圖例說明：**

| 圖示 | 說明 |
|---|---|
| **Pod 節點** | 叢集內的 Pod，顯示 Namespace 與 Pod 名稱 |
| **Service 節點** | Kubernetes Service 資源 |
| **External 節點** | Pod 連線至叢集外部的 IP 位址 |
| **連線線（Blocked）** | 紅色虛線，表示被 TracingPolicy Protect 模式阻擋的連線嘗試 |
| **連線線（Allowed）** | 實線，表示成功建立的 TCP 連線，顏色依連線類型區分 |
| **×N 標籤** | 邊線上的數字代表觀察期間偵測到的連線次數 |

---

## 篩選與搜尋

當叢集內 Pod 數量龐大時，可使用頁面頂部的篩選工具縮小顯示範圍：

- **Namespace 選單**：選擇特定 Namespace，僅顯示該 Namespace 內的 Pod 連線關係
- **Pod / Service 名稱搜尋框**：輸入名稱關鍵字，快速定位特定節點

---

## 圖形操作

| 操作 | 說明 |
|---|---|
| **拖曳節點** | 可自由移動節點位置，調整圖形佈局 |
| **滾輪縮放** | 放大或縮小整體圖形 |
| **Auto Layout** | 點擊右上角「Auto Layout」按鈕，重新自動排列所有節點位置 |
| **Refresh** | 點擊「Refresh」按鈕，重新向後端查詢最新的連線事件資料 |
| **Fit View** | 點擊右下角「Fit View」按鈕（⊡），將圖形縮放至完整顯示於視窗內 |
| **Zoom In / Out** | 點擊右下角 +/- 按鈕精確縮放 |
| **Mini Map** | 右下角縮略圖，顯示整體拓撲的全局位置 |

---

## 運作原理

Tetragon 透過掛載 `tcp_connect` kprobe 監控所有 TCP 連線建立事件，記錄來源 Pod、目標 IP/Port 與連線結果（允許或阻擋）。Sentinel 後端持續收集這些事件，依 Pod 與連線目標進行彙整，並將最新的連線關係暴露為 API 供前端圖形渲染使用。

:::tip
建議在開啟 TracingPolicy 的 Monitoring 模式並讓工作負載正常運行一段時間後，再查看 Network Topology。累積足夠的網路事件後，圖形能更完整地呈現實際的連線行為，有助於制定精準的網路 Whitelist / Blacklist 規則。
:::
