---
id: ingress
title: Ingress 存取
sidebar_position: 2
---

## 適用場景

正式環境、多人共用，需要固定網址存取。透過 Ingress 可讓團隊成員無須執行 `kubectl` 指令即可直接以瀏覽器開啟 Sentinel 管理介面。

## 前置需求

叢集需已安裝 Ingress Controller，常見選項包含：

- **nginx-ingress**（`ingress-nginx`）
- **Traefik**

請確認 Ingress Controller 已正常運作並取得外部 IP 後，再進行以下設定。

## 建立 Ingress 資源

建立一個 YAML 檔案，例如 `sentinel-ingress.yaml`，內容如下：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sentinel-ingress
  namespace: sentinel-system
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: sentinel.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sentinel-svc
                port:
                  number: 8080
```

**原理：** Ingress 是 Kubernetes 的 L7 路由資源，由 Ingress Controller 持續監聽（watch）Ingress 物件的異動，並自動設定 reverse proxy 規則，將外部 HTTP/HTTPS 請求路由至指定的 Service。

## 套用設定

將 YAML 套用至叢集並確認資源狀態：

```bash
kubectl apply -f sentinel-ingress.yaml
kubectl get ingress -n sentinel-system
```

成功套用後，`kubectl get ingress` 輸出應顯示 `sentinel-ingress` 並列出對應的 host 與 Address。

## 設定 DNS 或 hosts

需將 `sentinel.example.com` 指向 Ingress Controller 的 External IP：

```bash
# 確認 Ingress Controller 的 External IP
kubectl get svc -n ingress-nginx

# 若使用 /etc/hosts 進行本地測試（請替換為實際 IP）
echo "192.168.x.x sentinel.example.com" | sudo tee -a /etc/hosts
```

正式環境應在 DNS 服務商的控制台新增 A Record，將 `sentinel.example.com` 指向 Ingress Controller 的 External IP。

:::info
生產環境建議搭配 **cert-manager** 設定 TLS，自動申請與更新 Let's Encrypt 憑證，確保 HTTPS 加密傳輸。設定方式可參考 [cert-manager 官方文件](https://cert-manager.io/docs/)。
:::
