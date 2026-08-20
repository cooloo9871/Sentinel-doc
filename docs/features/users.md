---
id: users
title: 使用者管理
sidebar_position: 13
---

# 使用者管理

## 功能說明

使用者管理頁面提供 K8s Sentinel 儀表板的本地帳號管理功能，包含建立使用者、變更密碼，以及設定 Session 逾時時間。K8s Sentinel 採用 JWT（JSON Web Token）進行身份驗證，所有帳號資料儲存於本地資料庫中。

---

## 查看使用者列表

進入「**Settings → Users**」頁面後，目前所有使用者帳號會以列表形式呈現。

![使用者列表](/img/features/users/list.png)

**列表欄位說明：**

| 欄位 | 說明 |
|---|---|
| **使用者名稱** | 登入用的帳號名稱 |
| **角色** | 使用者角色（`admin` 或 `viewer`） |
| **建立日期** | 帳號建立時間 |
| **Change Password** | 修改該帳號的登入密碼 |

---

## 變更密碼

點擊帳號列的「**Change Password**」開啟變更密碼對話框：

![Change Password 對話框](/img/features/users/change-password.png)

密碼安全規則（v0.47+）：

- **新密碼至少 8 個字元**（伺服器端強制）
- **變更自己的密碼需輸入目前密碼（Current Password）**，被劫持的 Session 無法無聲地把帳號主人鎖在門外
- admin **重設其他帳號**的密碼屬於獨立操作，不需要舊密碼，但同樣會寫入稽核
- 每一次密碼變更（含因目前密碼錯誤而被拒絕的嘗試）都會記錄在 [Audit Log](./audit-log.md)

另外，以預設 `admin` / `admin` 首次登入時會**強制要求先設定新密碼**，詳見[登入 K8s Sentinel](../login.md)。

---

## 建立新使用者

點擊頁面右上角的「**+ New User**」按鈕，進入新增使用者頁面（v0.42 起編輯器皆有獨立網址，可書籤、F5 重新整理不會遺失頁面）。

![新增使用者表單](/img/features/users/new-user.png)

**表單欄位說明：**

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Username** | ✅ | 登入帳號名稱，建立後不可修改 |
| **Password** | ✅ | 初始密碼，建議建立後由使用者自行變更 |
| **Role** | ✅ | 選擇角色：`admin`（完整存取權限）或 `viewer`（唯讀存取） |

填寫完成後點擊「**Create**」建立帳號。

---

## 角色說明

| 角色 | 說明 |
|---|---|
| **admin** | 完整的系統存取與管理權限，可建立/修改/刪除所有 Policy、管理使用者、修改系統設定 |
| **viewer** | 唯讀存取，可瀏覽所有頁面與資料，但無法進行任何新增、修改或刪除操作 |

---

## Session Timeout 設定

頁面下方提供 **Session Timeout** 設定，可調整 JWT Token 的有效期限（單位：秒）。

| 設定項目 | 說明 |
|---|---|
| **Timeout (seconds)** | JWT Token 的存活時間，預設為 `3600`（1 小時） |

修改完成後點擊「**Save**」儲存。

:::warning
Session Timeout 的變更會在**下次登入後**生效，目前已登入的 Session 不受影響，需重新登入才會套用新的逾時設定。
:::
