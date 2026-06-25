---
id: alerts
title: 告警通知（Alerts）
sidebar_position: 14
---

# 告警通知（Alerts）

## 功能說明

Alerts 頁面允許使用者設定 **Webhook 告警規則**，當 Security Events 或 Admission Events 中出現符合條件的事件時，Sentinel 會自動透過 HTTP POST 將告警訊息推送至指定的 Webhook URL，支援 Slack、Microsoft Teams、Discord 及任何相容的 Webhook 服務。

---

## 查看告警規則

進入「**Settings → Alerts**」頁面後，所有已設定的告警規則會以列表形式呈現。

![Alerts 頁面](/img/features/alerts/overview.png)

---

## 建立新告警規則

點擊頁面右上角的「**+ New Rule**」按鈕，展開告警規則建立表單。

![新增告警規則表單](/img/features/alerts/new-rule.png)

**表單欄位說明：**

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Name** | ✅ | 告警規則的顯示名稱，用於識別此規則的用途 |
| **Cooldown (minutes)** | ✅ | 同一規則的最小觸發間隔（分鐘），防止短時間內大量重複推送；預設為 5 分鐘 |
| **Webhook URL** | ✅ | 接收告警的 Webhook 端點，例如 Slack Incoming Webhook URL |
| **Event Type** | — | 勾選觸發來源：`Security Events`（Tetragon kprobe 事件）、`Admission Events`（Admission Policy 違規） |
| **Severity** | — | 勾選要觸發告警的嚴重性等級：`warning`、`critical` |
| **Namespaces** | — | 以逗號分隔的 Namespace 名稱；留空表示監控所有 Namespace |
| **Policies** | — | 以逗號分隔的 Policy 名稱；留空表示監控所有 Policy |

填寫完成後點擊「**Save**」儲存告警規則。

---

## 告警推送原理

當新的安全事件進入 Sentinel 且符合告警規則條件時，後端會：

1. 比對事件的 Namespace、Policy 名稱與嚴重性是否符合規則設定
2. 檢查是否在 Cooldown 期間內（避免重複推送）
3. 構建告警訊息 Payload 並以 HTTP POST 方式送出至 Webhook URL

---

## 支援的 Webhook 平台

Sentinel 的 Webhook 告警格式相容於以下主流平台：

| 平台 | 說明 |
|---|---|
| **Slack** | 使用 Slack Incoming Webhooks 即可接收告警訊息 |
| **Microsoft Teams** | 使用 Teams Incoming Webhook Connector 接收告警 |
| **Discord** | 使用 Discord Webhook URL 接收告警 |
| **自訂 HTTP Endpoint** | 任何可接收 HTTP POST JSON Payload 的服務均可整合 |

:::tip
建議為不同嚴重性設定不同的告警規則，例如將 `critical` 等級事件推送至高優先級頻道，`warning` 等級推送至一般監控頻道，以區分處理優先順序。
:::
