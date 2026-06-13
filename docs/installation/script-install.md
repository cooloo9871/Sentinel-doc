---
id: script-install
title: 本機腳本安裝
sidebar_position: 3
---

# 本機腳本安裝

## 安裝原理說明

`install.sh` 是一個互動式 bash 腳本，會依序執行以下操作：

1. 偵測並安裝 Helm（若本機尚未安裝）
2. 使用 Helm 安裝 Tetragon 至叢集（若叢集尚未部署）
3. 透過 `kubectl apply` 將 Sentinel 部署至 `sentinel-system` namespace

整個安裝流程在本機執行，每個步驟均會輸出進度訊息，方便直接觀察安裝狀態，適合快速試用或開發測試環境。

---

## 步驟一：Clone 原始碼

```bash
git clone https://github.com/cooloo9871/Sentinel.git
cd Sentinel/deploy
```

取得原始碼後，進入 `deploy/` 目錄，安裝腳本 `install.sh` 即位於此目錄下。

---

## 步驟二：賦予執行權限

```bash
chmod +x install.sh
```

**原理**：Linux 系統預設不允許直接執行從網路下載的腳本，需明確使用 `chmod +x` 賦予執行位元（execute bit），才能以 `./install.sh` 方式執行。這是一種安全機制，防止意外執行未知腳本。

---

## 步驟三：執行安裝腳本

```bash
./install.sh
```

**原理**：腳本依序執行以下流程：

1. **安裝 Helm** — 若本機未偵測到 `helm` 指令，腳本會自動下載並安裝最新穩定版 Helm
2. **使用 Helm 安裝 Tetragon** — 透過 Cilium 官方 Helm Chart 將 Tetragon 部署至叢集
3. **kubectl apply 部署 Sentinel 清單** — 建立 ServiceAccount、ClusterRole、ClusterRoleBinding、Deployment 和 Service 等所需資源

---

## 步驟四：觀察安裝輸出

安裝過程中，腳本會輸出各階段的進度訊息，主要區段說明如下：

| 輸出訊息階段 | 說明 |
|---|---|
| `[INFO] Checking Helm...` | 偵測本機是否已安裝 Helm |
| `[INFO] Installing Helm...` | 下載並安裝 Helm（僅在未安裝時出現） |
| `[INFO] Installing Tetragon via Helm...` | 使用 Helm 部署 Tetragon 至叢集 |
| `[INFO] Deploying Sentinel...` | 套用 Sentinel 相關 Kubernetes 資源 |
| `[INFO] Installation complete.` | 所有資源建立完成 |

安裝完成後，腳本最後會顯示建議的 port-forward 指令，例如：

```bash
kubectl port-forward svc/sentinel-svc -n sentinel-system 8080:8080
```

可複製此指令並在本機執行，即可透過瀏覽器開啟 Sentinel 管理介面。

---

## 步驟五：確認部署狀態

```bash
kubectl get all -n sentinel-system
```

**預期結果**：

- Pod 狀態為 `Running`
- Service 類型為 `ClusterIP`，已取得內部 IP

```
NAME                                     READY   STATUS    RESTARTS   AGE
pod/sentinel-7d9f8b6c4-xxxxx            1/1     Running   0          2m

NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/sentinel-svc   ClusterIP   10.96.123.45    <none>        8080/TCP   2m

NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/sentinel    1/1     1            1           2m
```

若 Pod 未能進入 `Running` 狀態，可透過以下指令查看詳細錯誤訊息：

```bash
kubectl describe pod -n sentinel-system
kubectl logs -n sentinel-system deployment/sentinel
```

---

:::warning 正式環境注意事項
腳本執行過程中會自動安裝 Helm 並修改叢集設定（新增 Tetragon、建立 RBAC 資源等）。在**正式環境**中，這類自動化操作可能繞過變更審查流程，建議改用 [Kubernetes Job 安裝](./job-install) 方式，以保有更好的操作透明度與控制性。
:::
