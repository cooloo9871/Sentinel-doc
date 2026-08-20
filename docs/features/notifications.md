---
id: notifications
title: Security Events
sidebar_position: 8
---

# Security Events

## 功能說明

Security Events 頁面以即時串流方式顯示 Tetragon 偵測到的 kprobe 事件，包含所有違反 TracingPolicy 規則的安全事件。無論是 Monitoring 模式下記錄的行為，或是 Protect 模式下被阻擋的操作，皆會在此頁面即時呈現。

---

## 即時串流原理

K8s Sentinel 後端（v0.43+）透過各節點 Tetragon Agent 的 **gRPC `GetEvents` 串流**收集執行期事件（因此 Tetragon 需將 gRPC 綁定至 Pod 網路，見 [安裝 Tetragon](../installation/tetragon-install.md)），再以 **Server-Sent Events（SSE）** 建立一條從伺服器到瀏覽器的單向持久連線，持續將新事件推送至前端頁面，無需定期輪詢（polling），確保事件以最低延遲呈現。

---

## 查看安全事件

進入「**Security Events**」頁面後，事件會以時間倒序列出，最新事件顯示於最上方。

![Security Events 頁面](/img/features/notifications/list.png)

**頁面頂部工具列說明：**

| 元素 | 說明 |
|---|---|
| **Live / Disconnected 指示燈** | `Live` 代表 SSE 連線正常，事件正在即時接收中；`Disconnected` 代表串流連線中斷，稍待或重新整理頁面即可重連 |
| **⏸ Pause** | 點擊後暫停事件串流，頁面凍結目前列表方便審閱；再次點擊恢復即時接收 |
| **Export CSV** | 將目前顯示的事件列表匯出為 CSV 檔案，方便離線分析或存檔 |

**事件統計列：** 顯示目前資料庫中的事件總數、Warning 數量與 Critical 數量。

---

## 過濾事件

頁面上方提供三種過濾器，可同時套用（AND 邏輯）：

| 過濾器 | 說明 |
|---|---|
| **Search pod name...** | 輸入 Pod 名稱關鍵字即時篩選 |
| **All namespaces** | 從下拉選單選擇特定 Namespace，僅顯示該 Namespace 內的事件 |
| **Filter** | 開啟過濾面板，可勾選 **Severity**（`Warning` / `Critical`）與 **Rule** 類型（`Process` / `File` / `Network` / `Kernel`）多重條件 |

---

## 事件表格欄位

| 欄位 | 說明 |
|---|---|
| **Severity** | 嚴重性等級：`Warning` 或 `Critical` |
| **Rule / Detail** | 觸發事件的規則類型（Process Rule / File Rule / Network Rule）及相關摘要，例如執行的 binary 名稱或連線目標 IP |
| **Namespace** | 觸發事件的 Pod 所在 Namespace |
| **Pod / Container** | 觸發事件的 Pod 名稱與 Container 名稱 |
| **Policy** | 匹配到此事件的 TracingPolicy 名稱 |
| **Time** | 事件發生的時間（相對時間，例如「just now」、「5m ago」） |

**點擊任意事件列**可展開該事件的詳細資訊面板：

![事件詳細資訊面板](/img/features/notifications/detail.png)

詳細面板包含 **Binary**（完整執行檔路徑與參數）、**Parent**（父行程完整指令）、**User**（執行者與 uid）、**Namespace**、**Pod / Container**、**Policy**、**Function**（觸發的 Kernel 函式，例如 `__x64_sys_execve`）、**Hook**（掛勾類型，例如 kprobe）、**Node**（事件發生的節點）與 **Time** 等原始資料。

LSM 掛勾的事件也會顯示該呼叫實際觸及的對象，例如 `file_open` 顯示 `File (open): /etc/shadow`、`socket_connect` 顯示 `Destination: 10.0.0.5:443`。

面板右下角提供「**Quarantine this pod**」按鈕，可直接對觸發此事件的 Pod 執行網路隔離，詳見 [Pod 隔離（Quarantine）](./quarantine.md)。

---

## 事件嚴重性分類

| 等級 | 說明 |
|---|---|
| **Warning** | Monitoring 模式下記錄的違規行為，例如執行非預期的程式、存取非預期的檔案路徑，或發起異常網路連線，需進一步審查 |
| **Critical** | **在 Protect 模式下被強制阻擋的行為**（Tetragon 以 Signal / NotifyEnforcer 終止行程），無論掛勾類型一律列為 Critical，需立即檢視 |

---

:::info
安全事件的保留數量與天數可在「**Settings → Event Retention**」頁面進行調整。預設保留最多 500 筆 Warning 事件、300 筆 Critical 事件，TTL 為 7 天。
:::
