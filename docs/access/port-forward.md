---
id: port-forward
title: Port-forward 存取
sidebar_position: 1
---

## 適用場景

本機開發、快速測試，不需要設定 Ingress 或 LoadBalancer。適合開發人員在本地端直接連線至叢集內的 Sentinel 服務進行功能驗證。

## 步驟一：執行 port-forward

將叢集內的 Service 對應到本機 port：

```bash
kubectl port-forward -n sentinel-system svc/sentinel-svc 8080:8080
```

**原理：** `kubectl port-forward` 在本機建立一條 tunnel，透過 Kubernetes API Server 轉發封包到 Pod。連線期間此指令會持續佔用終端機，關閉終端機或按下 `Ctrl+C` 即會中斷連線。

## 步驟二：開啟瀏覽器

在瀏覽器輸入：

```
http://localhost:8080
```

預設帳號密碼：

| 欄位 | 預設值 |
|------|--------|
| Username | `admin` |
| Password | `admin` |

> 首次登入後請立即修改密碼，避免安全風險。

## 步驟三：確認登入畫面

![登入畫面](/img/access/login.png)

輸入 Username 與 Password 後點擊 **Sign in** 按鈕完成登入。

**原理：** Sentinel 使用 JWT（JSON Web Token）進行認證。登入成功後，token 會存於瀏覽器的 `localStorage`，後續每次請求均自動帶入 Authorization header 進行身份驗證。

## 背景執行建議

:::tip
若不想佔用終端機，可加上 `&` 讓 port-forward 在背景執行：

```bash
kubectl port-forward -n sentinel-system svc/sentinel-svc 8080:8080 &
```

若需停止背景執行的 port-forward，可使用 `fg` 將其帶回前景後按 `Ctrl+C`，或以 `kill %1` 終止。
:::

:::warning
`port-forward` 僅適合本機單人存取，不適用於多人共享或正式環境。正式環境請改用 Ingress 方式存取（參考 [Ingress 存取](./ingress.md)）。
:::
