---
id: trivy-operator
title: 安裝 Trivy Operator（弱點掃描）
sidebar_position: 5
---

# 安裝 Trivy Operator（弱點掃描）

## 為什麼需要

v0.60 起新增的 [Vulnerabilities](../features/vulnerabilities.md) 頁面，顯示的是 [Trivy Operator](https://github.com/aquasecurity/trivy-operator) 的掃描結果。**K8s Sentinel 本身不掃描執行中工作負載的 Image**：Trivy Operator 負責掃描並寫出 `VulnerabilityReport` 資源，K8s Sentinel 只負責讀取與呈現。

Trivy Operator 是**選用元件**。沒有安裝時，Vulnerabilities 頁面會顯示掃描尚未啟用，其餘功能完全不受影響。

| 安裝方式 | 是否自動安裝 Trivy Operator |
|---|---|
| [Kubernetes Job 安裝](./job-install.md) | 是（v0.61 起），已存在時跳過 |
| [本機腳本安裝](./script-install.md) | 是（v0.61 起），已存在時跳過 |
| 只套用 `deploy/sentinel.yaml` | 否，需依本頁手動安裝 |

兩種安裝程式都把 Trivy Operator 裝進 **`sentinel-system`**（與 K8s Sentinel 同一個 Namespace），Helm release 名稱為 `trivy-operator`；只要叢集任一 Namespace 已存在 Trivy Operator 的 Deployment 就會跳過。

---

## 手動安裝

先確認 `deploy/sentinel.yaml` 已套用（Namespace `sentinel-system` 由它建立），再於 K8s Sentinel 原始碼目錄下執行：

```bash
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm repo update
helm install trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml
```

確認 Operator 就緒，並觀察報告陸續產生：

```bash
kubectl rollout status deployment/trivy-operator -n sentinel-system
kubectl get vulnerabilityreports -A
```

---

## trivy-operator-values.yaml 做了什麼

`deploy/trivy-operator-values.yaml` 是 K8s Sentinel 提供的 Helm values，做了四件事：

| 設定 | 原因 |
|---|---|
| **只保留弱點掃描器** | K8s Sentinel 只讀 `VulnerabilityReport`。Config audit、RBAC 與 infra assessment、compliance、exposed secret 掃描與 SBOM 產生全部關閉，避免徒增負載。其中 infra assessment 還會在每個節點啟動具主機存取權的 `node-collector` Pod |
| **Pod 符合 Namespace 的安全等級** | `sentinel-system` 強制 Pod Security 的 restricted 等級，因此 Operator 與掃描 Pod 都以非 root 身分、預設 seccomp profile 執行 |
| **所有掃描共用一個 Trivy server** | `trivy-server` Pod 持有弱點資料庫與掃描快取，掃描 Pod 只是它的 client。若沿用 chart 預設，每個掃描 Pod 都要自行下載資料庫，而且同一個掃描 Pod 內的多個容器會爭奪同一把快取鎖，搶輸的以 `cache may be in use by another process` 失敗，造成多 Image 的工作負載停在部分掃描或未掃描。Server 的資料庫放在 `emptyDir`，不需要 StorageClass，重啟後會重新下載 |
| **單次掃描上限 15 分鐘（預設 5 分鐘）** | 慢速網路下拉取大型 Image 可能超過 chart 預設。逾時的掃描會被直接移除，Operator log 不會留下錯誤，工作負載只會一直停在未掃描 |

---

## 掃描行為

- Operator 啟動後會對每個工作負載掃描一次；之後在工作負載變更，或報告過期（預設 24 小時）時重新掃描
- 每次掃描是 `sentinel-system` 內一個短命的 `scan-vulnerabilityreport-*` Pod：每個工作負載一個 Pod、每個 Image 一個容器，同時最多 10 個（`operator.scanJobsConcurrentLimit`）
- 剛安裝完會出現一波掃描 Pod，那是對整個叢集的第一輪掃描，完成後會自動移除

---

## 升級注意事項

### 從沒有 Vulnerabilities 頁面的版本升級（v0.59 以前）

重新套用 `deploy/sentinel.yaml`。ClusterRole 新增了 `vulnerabilityreports` 與 `jobs` 的唯讀規則；缺少前者時，頁面會顯示 K8s Sentinel 沒有讀取報告的權限。

```bash
kubectl apply -f deploy/sentinel.yaml
```

### 升級到含 Registry 掃描的版本（v0.62+）

1. 重新套用 `deploy/sentinel.yaml`：新增了 `sentinel-system` 內的 Role `sentinel-registry-scan`，供 Registry 掃描的 Job 使用；缺少時每一次 Registry 掃描都會以權限錯誤失敗
2. 以目前的 values 升級 Operator，讓它不要去掃描那些 Job：

```bash
helm upgrade trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml
```

### 工作負載一直停在 partial 或 Not scanned

以較舊版 values 安裝的 Operator 沒有上述的 Trivy server。用同一條 `helm upgrade` 指令套用目前的 values，再重啟 Operator 讓它補掃缺少的部分：

```bash
kubectl -n sentinel-system rollout restart deployment/trivy-operator
```

### 搬移 v0.61.0 裝在 `trivy-system` 的 Operator

v0.61.0 的安裝程式把 Operator 裝在 `trivy-system`，v0.61.1 起改裝在 `sentinel-system`。搬移方式：

```bash
helm uninstall trivy-operator --namespace trivy-system
kubectl delete namespace trivy-system
bash deploy/install.sh
```

既有的弱點報告存放在各工作負載所屬的 Namespace，不會因此消失。

### 清除其他掃描器留下的報告

曾以 chart 預設值執行過的 Operator，會替每一種掃描器都寫出報告；關閉掃描器並不會刪除已寫出的內容。這些報告不再有人讀取，也不會過期，光是 SBOM 報告就可能比全部弱點報告加起來還大。可一次清除：

```bash
kubectl delete sbomreports,configauditreports,exposedsecretreports,rbacassessmentreports,infraassessmentreports --all --all-namespaces
kubectl delete clustersbomreports,clusterconfigauditreports,clusterrbacassessmentreports,clusterinfraassessmentreports --all
```

若有其他工具在讀取這些報告請保留；K8s Sentinel 不使用它們。

---

## 離線（Air-gapped）叢集

Trivy 以 OCI artifact 的形式下載弱點資料庫，預設從 `mirror.gcr.io` 拉取資料庫與自身的 Image。無法連外的叢集，請把下列內容複製到叢集可存取的 Registry：

| 項目 | 預設位置 |
|---|---|
| Trivy Image | `mirror.gcr.io/aquasec/trivy` |
| 弱點資料庫 | `mirror.gcr.io/aquasec/trivy-db` |
| Java 索引資料庫 | `mirror.gcr.io/aquasec/trivy-java-db` |

再以額外的 values 檔（例如 `trivy-values.yaml`）把 chart 指向該 Registry：

```yaml
trivy:
  image:
    registry: registry.internal.example
  dbRegistry: registry.internal.example
  dbRepository: aquasec/trivy-db
  javaDbRegistry: registry.internal.example
  javaDbRepository: aquasec/trivy-java-db
```

```bash
helm install trivy-operator aqua/trivy-operator \
  --namespace sentinel-system \
  --values deploy/trivy-operator-values.yaml \
  --values trivy-values.yaml
```

**Registry 掃描是由 K8s Sentinel 啟動，不是 Operator**，因此同樣的位置要另外設定在 K8s Sentinel Deployment 的環境變數：

| 環境變數 | 預設值 | 說明 |
|---|---|---|
| `TRIVY_IMAGE` | `mirror.gcr.io/aquasec/trivy:0.76.1` | Registry 掃描所執行的 Trivy Image |
| `TRIVY_DB_REPOSITORY` / `TRIVY_JAVA_DB_REPOSITORY` | Trivy 的預設值 | Registry 掃描下載弱點資料庫的位置；離線叢集請兩者都指向內部 mirror |

:::note
資料庫的新舊取決於內部 Registry 中的副本，請排程定期更新 mirror。Operator 自身的 Image 與工作負載所使用的 Registry 也需要同樣處理，私有 Registry 與認證的設定請參考 [Trivy Operator 官方文件](https://aquasecurity.github.io/trivy-operator/)。
:::
