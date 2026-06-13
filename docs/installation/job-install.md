---
id: job-install
title: Kubernetes Job 安裝
sidebar_position: 2
---

# Kubernetes Job 安裝

## 安裝原理說明

Sentinel 透過 Kubernetes Job 執行安裝腳本，自動建立所需的 ServiceAccount、ClusterRole、ClusterRoleBinding、Deployment 和 Service。整個安裝流程使用 Kustomize 管理 YAML 資源，確保資源定義的一致性與可重現性。

Job 方式的核心優勢在於安裝程序完全在叢集內部執行，不依賴本機環境，適合在 CI/CD Pipeline 或無法直接操作本機 bash 環境的情境下使用。

---

## 步驟一：Clone 原始碼

**操作**：取得部署設定檔

```bash
git clone https://github.com/cooloo9871/Sentinel.git
cd Sentinel
```

**原理**：`deploy/` 目錄包含所有 Kubernetes 部署清單與安裝 Job 的定義檔案，包括 `install-job.yaml` 與 Kustomize 管理的各類資源 YAML。

---

## 步驟二：套用 install-job.yaml

**操作**：建立安裝 Job

```bash
kubectl apply -f deploy/install-job.yaml
```

**原理**：此命令向叢集提交一個 Kubernetes Job 資源。Job 會在叢集內部啟動一個 Pod 並執行安裝腳本，相比本機腳本，可確保網路環境一致性，避免因本機防火牆或 proxy 設定造成的問題。

---

## 步驟三：確認 Job 完成

```bash
kubectl get jobs -n sentinel-system
kubectl logs -n sentinel-system job/sentinel-install
```

**原理**：Job 成功完成後，`COMPLETIONS` 欄位會顯示 `1/1`，代表所有 Kubernetes 資源已建立完成。透過 `kubectl logs` 可檢視安裝腳本的詳細輸出，確認每個資源是否正確建立。

預期輸出範例：

```
NAME               COMPLETIONS   DURATION   AGE
sentinel-install   1/1           30s        2m
```

---

## 步驟四：確認 Pod 就緒

```bash
kubectl get pods -n sentinel-system
kubectl get svc -n sentinel-system
```

**預期輸出**：

- `sentinel-XXXX` Pod 狀態為 `Running`
- Service `sentinel-svc` 建立完成，顯示 ClusterIP

```
NAME                        READY   STATUS    RESTARTS   AGE
sentinel-7d9f8b6c4-xxxxx    1/1     Running   0          3m

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
sentinel-svc    ClusterIP   10.96.123.45    <none>        8080/TCP   3m
```

若 Pod 狀態為 `Pending` 或 `CrashLoopBackOff`，請使用 `kubectl describe pod <pod-name> -n sentinel-system` 查看詳細事件。

---

## 持久化儲存（選用）

:::info 關於持久化儲存
若需要在 Pod 重啟後保留使用者設定與 TracingPolicy 資料，可在部署前設定 PersistentVolume，並將其掛載至容器的 `/data/sentinel/` 路徑。

請在執行 `kubectl apply -f deploy/install-job.yaml` 之前，先建立並確認 PV/PVC 設定：

```bash
# 確認 PV 設定（可選）
kubectl get pv,pvc -n sentinel-system
```

詳細的 PersistentVolume 設定方式請參考 [Kubernetes 官方文件](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)。
:::
