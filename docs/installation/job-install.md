---
id: job-install
title: Kubernetes Job 安裝
sidebar_position: 2
---

# Kubernetes Job 安裝

## 安裝原理說明

以一個 Kubernetes Job（`sentinel-installer`，位於 **`kube-system`**）在叢集內部完成安裝，本機不需要 git、helm 或任何工具，只需要 `kubectl`。Job 依序執行兩個步驟：

1. **Tetragon**：若叢集已存在 `tetragon` DaemonSet 則跳過；否則以 Helm 安裝，並設定 `tetragon.grpc.address=0.0.0.0:54321`（K8s Sentinel 收集事件所需），等待 DaemonSet 就緒
2. **K8s Sentinel**：直接從 GitHub 套用 `deploy/sentinel.yaml`（Namespace、RBAC、Deployment、Service 一個檔案全部包含，不使用 Kustomize），等待 Deployment 就緒

安裝程序完全在叢集內部執行，不依賴本機環境，適合 CI/CD Pipeline 或無法在本機執行 bash 的情境。

:::note[前置需求]
- Job 在叢集內執行，需要能對外連線至 `helm.cilium.io` 與 `raw.githubusercontent.com`
- 安裝 Job 以 `cluster-admin` 權限執行（建立 Namespace 與 ClusterRole 所需）；Job 的 ServiceAccount 位於 `kube-system`
:::

---

## 步驟一：套用 install-job.yaml

**操作**：直接以來源 URL 建立安裝 Job，不需要事先 clone 專案

```bash
kubectl apply -f https://raw.githubusercontent.com/cooloo9871/K8s_Sentinel/main/deploy/install-job.yaml
```

**原理**：此命令建立三個資源，全部位於 **`kube-system`**：ServiceAccount `sentinel-installer`、綁定 `cluster-admin` 的 ClusterRoleBinding，以及 Job `sentinel-installer`。Job 啟動一個 Pod 在叢集內執行安裝，網路環境一致，不受本機防火牆或 proxy 影響。

---

## 步驟二：追蹤安裝進度並確認完成

```bash
# 即時追蹤安裝日誌
kubectl logs -n kube-system job/sentinel-installer -f

# 確認 Job 完成
kubectl get jobs -n kube-system
```

**原理**：Job 成功完成後 `COMPLETIONS` 顯示 `1/1`。日誌會依序輸出 `[1/2] Tetragon` 與 `[2/2] Deploying K8s Sentinel` 兩階段的進度。

預期輸出範例：

```
NAME                 COMPLETIONS   DURATION   AGE
sentinel-installer   1/1           45s        2m
```

:::note
Job 的 Pod 設有 `ttlSecondsAfterFinished: 600`，完成 10 分鐘後會自動刪除，屆時將無法再查看日誌，屬正常現象。
:::

---

## 步驟三：確認 K8s Sentinel 就緒

K8s Sentinel 本體安裝於 **`sentinel-system`** Namespace（安裝 Job 則在 `kube-system`）：

```bash
kubectl get pods -n sentinel-system
kubectl get svc -n sentinel-system
```

**預期輸出**：

- `sentinel-XXXX` Pod 狀態為 `Running`
- Service `sentinel` 建立完成，顯示 ClusterIP

```
NAME                        READY   STATUS    RESTARTS   AGE
sentinel-7d9f8b6c4-xxxxx    1/1     Running   0          3m

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
sentinel        ClusterIP   10.96.123.45    <none>        80/TCP     3m
```

若 Pod 狀態為 `Pending` 或 `CrashLoopBackOff`，請使用 `kubectl describe pod <pod-name> -n sentinel-system` 查看詳細事件。

---

## 清理安裝 Job（選用）

安裝完成後，可移除安裝 Job 及其 ServiceAccount 與 ClusterRoleBinding（不影響已安裝的 K8s Sentinel）：

```bash
kubectl delete -f https://raw.githubusercontent.com/cooloo9871/K8s_Sentinel/main/deploy/install-job.yaml
```

---

:::info[持久化儲存]
預設部署使用 `emptyDir`，Pod 重啟後帳號、規則與事件資料會全部重置。正式環境請接著完成[設定永久儲存（PV / PVC）](./persistent-storage.md)。
:::
