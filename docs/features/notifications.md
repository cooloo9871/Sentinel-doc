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

後端透過 **Server-Sent Events（SSE）** 技術，建立一條從伺服器到瀏覽器的單向持久連線，持續將 Tetragon 偵測到的新事件推送至前端頁面，無需定期輪詢（polling），確保事件以最低延遲呈現。

---

## 查看安全事件

進入「**Security Events**」頁面後，事件會以時間倒序列出，最新事件顯示於最上方。

![Security Events 頁面](/img/features/notifications/list.png)

**頁面頂部工具列說明：**

| 元素 | 說明 |
|---|---|
| **Live 指示燈** | 綠色動態燈號代表 SSE 連線正常，事件正在即時接收中 |
| **⏸ Pause** | 點擊後暫停事件串流，頁面凍結目前列表方便審閱；再次點擊恢復即時接收 |
| **Export CSV** | 將目前顯示的事件列表匯出為 CSV 檔案，方便離線分析或存檔 |

**事件統計列：** 顯示目前資料庫中的事件總數、Warning 數量與 Critical 數量。

---

## 過濾事件

頁面上方提供三種過濾器，可同時套用（AND 邏輯）：

| 過濾器 | 說明 |
|---|---|
| **Search pod name...** | 輸入 Pod 名稱關鍵字即時篩選 |
| **All Namespaces** | 從下拉選單選擇特定 Namespace，僅顯示該 Namespace 內的事件 |
| **All Events** | 切換事件類型：`All Events`（全部）、`Process`（行程事件）、`File`（檔案存取事件）、`Network`（網路連線事件） |

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

**點擊任意事件列**可展開該事件的詳細資訊面板，顯示 binary 完整路徑、Container 名稱、連線來源與目標等原始資料。

---

## 事件嚴重性分類

| 等級 | 說明 |
|---|---|
| **Warning** | 潛在異常行為，例如執行非預期的程式、存取非預期的檔案路徑，或發起異常網路連線，需進一步審查 |
| **Critical** | 高危操作，例如嘗試執行特權程式、存取高度敏感的系統檔案（`/etc/shadow`、`/root/.ssh/`）或連線至已知惡意 IP，需立即處理 |

---

:::info
安全事件的保留數量與天數可在「**Settings → Event Retention**」頁面進行調整。預設保留最多 500 筆 Warning 事件、300 筆 Critical 事件，TTL 為 7 天。
:::
