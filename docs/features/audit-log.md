---
id: audit-log
title: 稽核日誌（Audit Log）
sidebar_position: 19
---

# 稽核日誌（Audit Log）

## 功能說明

Audit Log（v0.45+）記錄**每一筆透過 K8s Sentinel 執行的操作**，回答「誰、在什麼時候、對什麼對象、做了什麼」：Pod 隔離與解除、Global Protect Mode 切換、三種 Policy 的建立/修改/刪除、使用者管理、Alerts 與 Syslog 設定、Event Retention 變更，以及每一次登入嘗試與密碼變更。

進入「**Settings → Audit Log**」即可查看（僅 admin 角色可存取）：

![Audit Log 頁面](/img/features/audit/list.png)

---

## 欄位說明

| 欄位 | 說明 |
|---|---|
| **Time** | 操作發生的時間 |
| **User** | 執行操作的登入帳號；登入嘗試則記錄**嘗試登入的帳號**（包含不存在的帳號名稱） |
| **Action** | 可讀的操作名稱，例如 `Quarantine pod`、`Delete network policy`、`Sign in`、`Change user password` |
| **Target** | 操作對象：Pod、Policy 或使用者名稱（從 URL 或請求內容的 `metadata.name` 解析）；登入嘗試記錄**來源 IP** |
| **Status** | 結果，以文字呈現：`Success` / `Rejected` / `Denied` / `Not found` / `Conflict` / `Rate limited` / `Error`，滑鼠懸停可見原始 HTTP 狀態碼 |

**被拒絕的嘗試也會記錄**，不只有成功的操作，例如輸入錯誤目前密碼的改密碼請求（403）、密碼錯誤的登入（401）、被限流的登入（429），都會留下紀錄。

---

## 篩選與匯出

- **篩選**：頂部的「Filter by user, action or target...」輸入框可依使用者、操作或對象即時過濾
- **Export CSV**（v0.46+）：將**目前畫面上顯示**的紀錄匯出為 CSV（Time、User、Action、Target、Status、Method、Path），套用中的篩選條件也會反映在匯出檔中。CSV 帶有 UTF-8 BOM，Excel 可直接正確開啟

---

## 運作原理與限制

- 由掛在 admin 路由群組上的 middleware 統一記錄，新增的寫入型 API 會**自動**被涵蓋，無需逐一接線；登入與改密碼兩個特例路由（不在 admin 群組內）也各自掛上了稽核
- **只記錄寫入**：讀取（GET）不會被記錄，查看 Audit Log 本身也不會產生新紀錄
- **Append-only 且持久化**，上限 **5,000 筆**（超過淘汰最舊的），防止以灌入紀錄的方式擠掉既有證據；被限流（429）的登入不寫入稽核，避免洪水式攻擊淘汰真正的管理紀錄
- 密碼內容永遠不會被記錄

:::tip
需要長期保存稽核紀錄時，建議定期以 **Export CSV** 匯出存檔，或搭配 [Syslog](./syslog.md) 將安全事件同步轉送至 SIEM；Audit Log 的 5,000 筆上限是滾動視窗，超出的最舊紀錄會被淘汰。
:::
