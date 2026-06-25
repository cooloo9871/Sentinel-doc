---
id: syslog
title: Syslog 轉送
sidebar_position: 15
---

# Syslog 轉送

## 功能說明

Syslog 頁面允許使用者設定將 Security Events 與 Admission Events 轉送至外部 **Syslog 伺服器**（rsyslog / syslog-ng）的規則，支援 UDP 與 TCP 兩種傳輸協定。透過 Syslog 整合，可將 Sentinel 的安全事件匯入現有的企業日誌基礎設施（如 SIEM 系統），實現集中化的安全事件管理與長期存檔。

---

## 查看 Syslog 設定

進入「**Settings → Syslog**」頁面後，所有已設定的 Syslog 轉送規則會以列表形式呈現。

![Syslog 頁面](/img/features/syslog/overview.png)

---

## 建立新 Syslog 設定

點擊頁面右上角的「**+ New Config**」按鈕，展開 Syslog 設定建立表單。

![新增 Syslog 設定表單](/img/features/syslog/new-config.png)

**表單欄位說明：**

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Name** | ✅ | 此 Syslog 設定的顯示名稱 |
| **Host** | ✅ | Syslog 伺服器的 IP 位址或 Hostname |
| **Port** | ✅ | Syslog 服務的監聽 Port，預設為 `514` |
| **Protocol** | ✅ | 傳輸協定：`udp`（低延遲，不保證送達）或 `tcp`（可靠傳輸） |
| **Event Type** | — | 勾選要轉送的事件類型：`Security`（Tetragon kprobe 事件）、`Admission`（Admission Policy 違規） |
| **Severity** | — | 勾選要轉送的嚴重性等級：`warning`、`critical` |
| **Namespaces** | — | 以逗號分隔的 Namespace 名稱；留空表示轉送所有 Namespace 的事件 |
| **Policies** | — | 以逗號分隔的 Policy 名稱；留空表示轉送所有 Policy 的相關事件 |

填寫完成後點擊「**Save**」儲存設定。

---

## 協定選擇建議

| 協定 | 適用情境 |
|---|---|
| **UDP** | 網路環境穩定、Syslog 伺服器在同一內網、對延遲較敏感的場景；傳輸速度快但不保證送達 |
| **TCP** | 需要可靠傳輸保證、跨網段或 WAN 環境；略有額外的連線維護開銷，但不會遺失訊息 |

:::tip
建議搭配 **Alerts（Webhook）** 功能使用：以 Webhook 接收即時告警通知，以 Syslog 進行長期事件存檔，兩者相輔相成，兼顧即時響應與合規稽核需求。
:::
