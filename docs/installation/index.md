---
id: index
title: 安裝概覽
sidebar_position: 1
---

# 安裝概覽

K8s Sentinel 提供三種安裝方式，可依據使用場景與需求選擇最適合的方法。

## 三種安裝方式比較

| 安裝方式 | 適用場景 | 需求 | 優點 |
|---|---|---|---|
| **Kubernetes Job** | 正式環境 / CI 流程 | kubectl 存取 | 自動化、無需手動操作 |
| **本機腳本 (install.sh)** | 快速試用 / 開發測試 | bash + kubectl | 直觀、步驟可見 |
| **離線安裝**（v0.71+） | 叢集無法連上網際網路 | 私有 Registry + kubectl | 叢集端不需要 Helm 與對外連線 |

## 共同前置步驟

無論選擇哪種安裝方式，在開始之前都需要確認環境已滿足下列前置需求：

- Kubernetes 叢集正常運行（版本 1.32+）
- 已安裝並設定好 `kubectl`，且具備叢集管理員權限
- Cilium 已部署至叢集，並啟用 kube-proxy replacement 與 Hubble（參考 [安裝與設定 Cilium](./cilium-install.md)）
- Tetragon 已安裝（參考 [安裝 Tetragon](./tetragon-install.md)）

請先完成 [前置需求](../prerequisites.md) 頁面中的所有確認項目，再繼續進行安裝。

:::caution[重新套用 deploy/sentinel.yaml 會還原檔案中的設定]
多數版本的升級都需要重新套用 `deploy/sentinel.yaml`。若你曾**修改該檔案**來調整 Deployment 或 Service（以 PVC 取代 `emptyDir`、`AUDIT_WEBHOOK_TOKEN`、固定的 Image 版本、`NodePort`），請先把這些修改帶進新的檔案，或套用你自己的副本。

直接套用原始檔案時，資料 volume 會回到 `emptyDir`，也就是一個只有 `admin` / `admin` 帳號的全新 K8s Sentinel，檔案中設定的 audit webhook token 也會消失。以 `kubectl set env` 或 `kubectl patch` 做的修改，以及你自行指定的 `clusterIP`，則會保留。
:::

:::caution[升級到 v0.66 到 v0.70（以掃描結果阻擋部署）]
- **重新套用 `deploy/sentinel.yaml`，再重啟 K8s Sentinel**：新增了 `VulnerabilityGate` 類型，v0.67、v0.68、v0.70 又各自擴充過；沒有重新套用時，對應的 Admission Policy 會全部放行，各版本的現象見 [以掃描結果阻擋部署](../features/vulnerability-admission.md)
- v0.65.0 的 Deployment Gate 頁面已移除，它建立的 Policy 會在升級時被移除，請在 Admission Policy 重新建立
- v0.69 以前建立的 Vulnerability Limit、Blocked CVEs、Host Path Volumes 與 Environment Variables Policy 建議在表單中重新建立，見 [Admission Policy](../features/admission-policy.md)
- v0.71、v0.72 沒有 manifest 變更
:::

:::caution[從 v0.42 以前的版本升級到 v0.43+]
v0.43 起事件收集改走 gRPC（不再使用 `kubectl exec`），既有環境升級前需完成三件事：

1. **Tetragon 開啟 gRPC**：`kubectl -n kube-system patch cm tetragon-config --type merge -p '{"data":{"server-address":"0.0.0.0:54321"}}'` 後 `rollout restart ds/tetragon`（詳見 [安裝 Tetragon](./tetragon-install.md)）
2. **Cilium 啟用 Hubble Relay**：`--set hubble.relay.enabled=true`（詳見 [安裝與設定 Cilium](./cilium-install.md)）
3. **重新套用 ClusterRole**：`kubectl apply -f deploy/sentinel.yaml`，新版移除了 `pods/exec` 權限（K8s Sentinel 持有的最大權限），並新增了 exposure 偵測所需資源的讀取權

全新安裝（install-job / install.sh）會自動處理，無需手動操作。
:::

:::caution[升級到 v0.64+]
- **所有使用者會被登出一次**：v0.64 起帳號被刪除或密碼變更後，其 Session 會被拒絕
- 以**已存在的名稱**建立 Tracing Policy 會被拒絕，不再覆蓋既有的 policy
- 可重新套用 `deploy/sentinel.yaml` 以移除不再使用的叢集層級 `pods/log` 權限（選用）
- **既有的 Tetragon 仍在 host network 上**：v0.64.1 起安裝程式會把 Tetragon 裝在 Pod 網路並以 NetworkPolicy 限制 gRPC 埠只有 K8s Sentinel 能連，但不會更動已安裝的 Tetragon，搬移方式見 [安裝 Tetragon](./tetragon-install.md)
:::

:::caution[升級到 v0.60+（弱點掃描）]
- **重新套用 `deploy/sentinel.yaml`**：ClusterRole 新增 `vulnerabilityreports` 與 `jobs` 的唯讀規則（v0.60），以及 `sentinel-system` 內供 Registry 掃描使用的 Role（v0.62）
- **Trivy Operator**：既有環境不會自動安裝，安裝與升級方式見 [安裝 Trivy Operator](./trivy-operator.md)
:::

安裝完成後：

- **正式環境請先完成 [設定永久儲存（PV / PVC）](./persistent-storage.md)**：預設的 `emptyDir` 會在 Pod 重啟時清空所有帳號、規則與事件資料
- 三種安裝方式都會一併安裝 Trivy Operator；若只套用 `deploy/sentinel.yaml`，請見 [安裝 Trivy Operator](./trivy-operator.md)
- 若需使用 Admission Events 功能，請另行完成 [串接 API Server Audit Log](./audit-webhook.md) 的設定

## 選擇建議

:::tip[如何選擇安裝方式？]
- **正式環境**建議使用 [Kubernetes Job 安裝](./job-install.md) 方式。Job 在叢集內部執行，確保網路環境一致性，且易於審計與自動化整合。
- **快速試用或開發測試**建議使用 [本機腳本安裝](./script-install.md) 方式。腳本會逐步輸出安裝進度，便於觀察與除錯。
- **叢集無法連上網際網路**時使用 [離線安裝](./offline-install.md)：先把 Image 搬到私有 Registry，再以離線套件安裝。
:::
