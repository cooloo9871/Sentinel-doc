---
id: login
title: 登入 K8s Sentinel
sidebar_position: 5
---

# 登入 K8s Sentinel

完成安裝並取得存取網址後，使用瀏覽器開啟 K8s Sentinel 管理介面，即會看到登入畫面。

## 登入畫面

![K8s Sentinel 登入畫面](/img/access/login.png)

## 預設帳號密碼

首次登入請使用以下預設帳號：

| 欄位 | 預設值 |
|------|--------|
| **Username** | `admin` |
| **Password** | `admin` |

輸入後點擊 **Sign in** 按鈕完成登入。

## 首次登入需設定新密碼（v0.47+）

以預設的 `admin` / `admin` 首次登入時，系統會**強制要求先設定新密碼**才能進入主控台：

![首次登入強制變更密碼](/img/access/first-login.png)

| 欄位 | 說明 |
|---|---|
| **Current password** | 輸入目前密碼（首次登入即 `admin`） |
| **New password** | 新密碼，**至少 8 個字元** |
| **Confirm new password** | 再次輸入新密碼確認 |

填寫完成後點擊「**Set password and continue**」即進入主控台。

此限制由**伺服器端強制執行**：在旗標尚未清除前，後端僅允許查詢自身帳號資訊與變更自身密碼兩個 API，無法以任何方式略過。密碼變更完成後旗標即清除。

:::warning
若尚未[設定永久儲存（PV / PVC）](./installation/persistent-storage.md)，帳號資料會存在 `emptyDir` 中，Pod 重啟後帳號將**還原為預設的 `admin` / `admin`**，屆時需重新走一次首次登入流程。
:::

## 登入安全機制

| 機制 | 說明 |
|---|---|
| **登入速率限制**（v0.47+） | 同一來源 IP 的失敗登入每分鐘最多 5 次，超過即短暫封鎖。以來源 IP 而非帳號計數，攻擊者無法藉由故意輸錯密碼將真實使用者鎖在門外 |
| **登入稽核**（v0.48+） | 每一次登入嘗試（成功、密碼錯誤、被限流）都會記錄在 [Audit Log](./features/audit-log.md)，包含目標帳號與來源 IP；密碼本身不會被記錄 |
| **JWT 認證** | 登入成功後 token 存於瀏覽器 `localStorage`，後續每次 API 請求自動帶入 `Authorization` header。Token 逾期（預設 Session Timeout 為 3600 秒）將自動登出。v0.53 起可用 [`JWT_SECRET` 環境變數](./installation/persistent-storage.md#只想讓-session-不因重啟登出jwt_secret)固定簽署金鑰，Pod 重啟不再造成全員登出 |

:::note[部署在 Proxy / Ingress 後方？]
速率限制與稽核記錄的來源 IP 預設取自連線本身（`RemoteAddr`）。若 K8s Sentinel 部署在會設定 `X-Forwarded-For` 的 Proxy 或 Ingress 後方，請在 Sentinel 容器設定環境變數 **`TRUST_PROXY_HEADERS=true`**，來源 IP 才會正確反映真實用戶端（v0.50+）。
:::
