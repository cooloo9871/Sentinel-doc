---
id: network-topology
title: 網路拓撲（Network Topology）
sidebar_position: 10
---

# 網路拓撲（Network Topology）

## 功能說明

Network Topology 以互動式圖形介面呈現叢集內各 Pod 之間的實際網路連線關係，資料來源為 **Cilium** 觀測到的網路流量（含 L7 應用層資訊，頁面右上角顯示「Cilium · L7」標示）。透過此視覺化圖形，維運人員無需解讀原始事件日誌，即可直觀掌握叢集內的流量走向，協助識別異常連線並作為制定 [Network Policy](./network-policy.md) 的依據。

---

## 查看網路拓撲圖

進入「**Network Topology**」頁面後，叢集內已觀察到的網路連線會自動以節點圖形式呈現。

![Network Topology 總覽](/img/features/network-topology/overview.png)

**節點與圖例說明：**

| 圖示 | 說明 |
|---|---|
| **Pod 節點** | 叢集內的 Pod，顯示 Namespace 與 Pod 名稱 |
| **Node 節點** | Kubernetes Node，顯示節點名稱與 IP 位址 |
| **External 節點** | 叢集外部的連線來源或目標（例如經由節點進入的外部流量） |
| **Exposed 連線** | 標示為 Exposed 的邊線，代表外部可直接觸及 Pod / Node 的暴露路徑 |
| **×N 標籤** | 邊線上的數字代表觀察期間累計的連線次數 |

---

## 連線詳情（Connection Detail）

點擊任一條邊線，右側會開啟 **Connection Detail** 面板，顯示該連線的完整資訊：

![Connection Detail 面板](/img/features/network-topology/connection-detail.png)

| 欄位 | 說明 |
|---|---|
| **來源 / 目標** | 連線兩端的 Pod 名稱與 IP 位址 |
| **Connections** | 累計連線次數 |
| **Ports** | 使用的目標 Port 及各 Port 的連線次數 |

---

## 篩選與檢視選項

頁面頂部工具列提供以下篩選與檢視工具：

| 元素 | 說明 |
|---|---|
| **All namespaces** | 選擇特定 Namespace，僅顯示該 Namespace 相關的連線 |
| **Pod name...** | 輸入 Pod 名稱關鍵字，快速定位特定節點 |
| **View 選單** | 勾選檢視選項：`Hide kube-system`（隱藏 kube-system，預設開啟）、`Hide health probes`（隱藏健康檢查流量，預設開啟）、`Exposed only`（僅顯示對外暴露的連線）、`Auto refresh`（自動更新，預設開啟） |
| **Auto Layout** | 重新自動排列所有節點位置 |
| **Refresh** | 立即重新查詢最新的連線資料 |

---

## 圖形操作

| 操作 | 說明 |
|---|---|
| **拖曳節點** | 可自由移動節點位置，調整圖形佈局 |
| **滾輪縮放** | 放大或縮小整體圖形 |
| **Zoom In / Out** | 點擊左下角 +/- 按鈕精確縮放 |
| **Fit View** | 將圖形縮放至完整顯示於視窗內 |
| **Toggle Interactivity** | 鎖定/解鎖圖形互動 |
| **Mini Map** | 右下角縮略圖，顯示整體拓撲的全局位置 |

---

## 運作原理

Cilium 作為叢集的 CNI，在資料平面觀測所有 Pod 的網路流量（包含 L7 層的協定資訊）。Sentinel 後端持續收集這些觀測資料，依 Pod、Node 與外部端點進行彙整，並將最新的連線關係提供給前端圖形渲染。開啟 `Auto refresh` 時，拓撲圖會自動更新以反映最新流量。

:::tip
建議讓工作負載正常運行一段時間、累積足夠的網路觀測資料後，再依拓撲圖上實際觀察到的連線（來源、目標與 Port）制定 Network Policy 的 Whitelist 規則，可有效避免遺漏必要連線。
:::
