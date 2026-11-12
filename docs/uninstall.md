---
id: uninstall
title: 解除安裝
sidebar_position: 17
---

:::warning
解除安裝會刪除 `sentinel-system` Namespace 內的所有資料，包含設定、使用者帳號與已儲存的事件。請在執行前確認已備份必要資料。
:::

## 使用 uninstall.sh（建議，v0.64.1+）

`deploy/uninstall.sh` 會移除 `deploy/install.sh` 與 `deploy/install-job.yaml` 所安裝的全部內容。於 K8s Sentinel 原始碼目錄下執行：

```bash
bash deploy/uninstall.sh --dry-run   # 只列出會被移除的項目
bash deploy/uninstall.sh             # 詢問確認後移除
```

移除的項目：

- K8s Sentinel 與 `sentinel-system` Namespace（含設定、帳號與已儲存的事件）
- Trivy Operator 與其 Trivy server
- Tetragon（含 NetworkPolicy `tetragon-grpc`）
- 安裝 Job 留在 `kube-system` 的資源
- **Quarantine policy 與 Pod 上的隔離 Label**：若留下隔離規則卻沒有 K8s Sentinel 可以解除，被隔離的 Pod 會永遠維持隔離

| 選項 | 效果 |
|---|---|
| `--dry-run` | 列出會被刪除的項目，不實際刪除 |
| `--keep-tetragon` | 保留 Tetragon，適用於 Tetragon 早於 K8s Sentinel 安裝的叢集 |
| `--purge` | 另外刪除在 K8s Sentinel 中建立的 Tracing、Network 與 Admission Policy、所有弱點報告，以及 Tetragon 與 Trivy 的 CRD |
| `--yes` | 不詢問確認 |

Tetragon 不在 `kube-system` 時，請設定環境變數 `TETRAGON_NAMESPACE`。

## 未使用 --purge 時會保留的內容

:::info
不加 `--purge` 時，在 K8s Sentinel 中建立的 Policy 會保留並**繼續生效**：Network Policy 由 Cilium 執行、Admission Policy 由 API Server 執行。Tracing Policy 的物件也會保留，但 Tetragon 移除後就不再有作用。弱點報告與 CRD 同樣會保留。
:::

若之後想手動清除，可列出並刪除：

```bash
kubectl get tracingpolicy,tracingpolicynamespaced --all-namespaces
kubectl delete tracingpolicynamespaced <name> -n <namespace>
kubectl delete tracingpolicy <name>
```

## 持久化資料

為 K8s Sentinel 資料加掛的 PersistentVolume，其 PVC 會隨 Namespace 一併刪除，實際資料是否保留取決於該 PV 的 reclaim policy。若使用 hostPath 或 Local Volume，節點上的資料目錄需手動刪除：

```bash
sudo rm -rf /data/sentinel/
```

> 執行 `sudo rm -rf` 前請再次確認路徑正確，此操作無法復原。
