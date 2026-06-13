---
id: uninstall
title: 解除安裝
sidebar_position: 17
---

:::warning
解除安裝將刪除所有 Sentinel 資源，包含使用者帳號與 JWT secret。但**不會**自動刪除已建立的 TracingPolicy，以避免影響叢集既有的安全策略。請在執行前確認已備份必要資料。
:::

## 步驟一：刪除 Sentinel Deployment 與 Service

逐一刪除 Deployment 與 Service：

```bash
kubectl delete deployment -n sentinel-system sentinel
kubectl delete service -n sentinel-system sentinel-svc
```

或使用 Kustomize 一次刪除所有由 `deploy/base/` 管理的資源：

```bash
kubectl delete -k deploy/base/
```

## 步驟二：刪除 Namespace

```bash
kubectl delete namespace sentinel-system
```

**原理：** 刪除 namespace 會同時刪除其中所有資源，包含 Pod、Service、ConfigMap、Secret 等。此操作不可逆，請確認已無需要保留的資料後再執行。

## 步驟三：移除 RBAC 資源

```bash
kubectl delete clusterrole sentinel-role
kubectl delete clusterrolebinding sentinel-rolebinding
```

**原理：** ClusterRole 和 ClusterRoleBinding 是叢集級別（cluster-scoped）資源，不屬於任何 namespace，因此刪除 namespace 時不會一併刪除，需手動清除。

## 步驟四：清除持久化資料（選用）

若 Sentinel 使用了 PersistentVolume 儲存資料，需另行清除：

```bash
kubectl delete pvc -n sentinel-system --all
# 若使用 hostPath，手動刪除節點上的資料目錄
sudo rm -rf /data/sentinel/
```

> 執行 `sudo rm -rf` 前請再次確認路徑正確，此操作無法復原。

## 保留 TracingPolicy

:::info
Sentinel 建立的 TracingPolicy CRD 資源不會被自動刪除，解除安裝後這些 Policy 仍會繼續由 Tetragon 執行。若確認不再需要，可手動清除：

```bash
# 列出所有 TracingPolicy 資源
kubectl get tracingpolicy,tracingpolicynamespaced --all-namespaces

# 刪除指定的 TracingPolicyNamespaced
kubectl delete tracingpolicynamespaced <name> -n <namespace>
```

若需刪除叢集級別的 TracingPolicy：

```bash
kubectl delete tracingpolicy <name>
```
:::
