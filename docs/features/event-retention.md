---
id: event-retention
title: 事件保留設定（Event Retention）
sidebar_position: 16
---

# 事件保留設定（Event Retention）

## 功能說明

Event Retention 頁面提供 Security Events 與 Admission Events 的資料保留策略設定，讓管理員可依據儲存空間與合規需求，調整事件資料庫的最大容量（筆數上限）與自動清除週期（TTL）。

---

## 設定頁面

進入「**Settings → Event Retention**」頁面後，提供兩個標籤頁分別設定不同來源的事件保留策略。

![Event Retention 設定頁面](/img/features/retention/overview.png)

---

## Security Events 保留設定

在「**Security Events**」標籤頁中，可設定 Tetragon kprobe 安全事件的保留策略：

| 設定項目 | 說明 | 預設值 | 範圍 |
|---|---|---|---|
| **Max Warning Events** | 資料庫中 Warning 等級事件的最大保留筆數；超過上限時，最舊的事件會被自動清除 | 500 | 1 – 5,000 |
| **Max Critical Events** | 資料庫中 Critical 等級事件的最大保留筆數 | 300 | 1 – 2,000 |
| **TTL (days)** | 事件的最長保留天數；超過此天數的事件無論數量多寡均會被自動清除 | 7 | 1 – 90 天 |

設定完成後點擊「**Save**」儲存。頁面下方會顯示「**Total capacity**」統計，說明目前設定的最大總事件容量。

---

## Admission Events 保留設定

切換至「**Admission Events**」標籤頁，可設定 ValidatingAdmissionPolicy 違規事件的保留策略，欄位設定與 Security Events 相同。

---

## 清除機制說明

Sentinel 後端以兩種條件觸發自動清除：

1. **超過數量上限**：當同一嚴重性等級的事件數量超過設定的最大值時，從最舊的事件開始刪除
2. **超過 TTL**：定期掃描資料庫，刪除所有建立時間超過 TTL 設定天數的事件

兩種條件相互獨立運作，符合任一條件的事件皆會被清除。

:::warning
調低最大事件數量或縮短 TTL 後，設定儲存時系統不會立即刪除超出範圍的現有事件，而是在下一次定期清除週期執行時生效。若需要保留較長的歷史記錄，建議搭配 **Syslog** 功能將事件同步轉送至外部日誌系統進行長期存檔。
:::
