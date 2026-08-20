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

:::warning
首次登入後請立即至「**Settings → Users**」修改預設密碼，避免未授權存取。

另外請注意：若尚未[設定永久儲存（PV / PVC）](./installation/persistent-storage.md)，修改後的密碼與所有設定會在 Pod 重啟後**還原為預設值**。
:::

## 登入原理

K8s Sentinel 使用 **JWT（JSON Web Token）** 進行認證。登入成功後，token 會存於瀏覽器的 `localStorage`，後續每次 API 請求均自動帶入 `Authorization` header 進行身份驗證。Token 逾期後（預設 Session Timeout 為 3600 秒）將自動登出，需重新登入。
