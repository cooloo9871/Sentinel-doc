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
| **離線安裝** | 叢集無法連上網際網路 | 私有 Registry + kubectl | 叢集端不需要 Helm 與對外連線 |

## 共同前置步驟

無論選擇哪種安裝方式，在開始之前都需要確認環境已滿足下列前置需求：

- Kubernetes 叢集正常運行（版本 1.32+）
- 已安裝並設定好 `kubectl`，且具備叢集管理員權限
- Cilium 已部署至叢集，並啟用 kube-proxy replacement 與 Hubble（參考 [安裝與設定 Cilium](./cilium-install.md)）
- Tetragon 已安裝（參考 [安裝 Tetragon](./tetragon-install.md)）

請先完成 [前置需求](../prerequisites.md) 頁面中的所有確認項目，再繼續進行安裝。

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

## 升級到 v0.83

從 v0.82 升級只需要更新 Image，不需要重新套用 manifest，也沒有資料移轉。既有的 Policy 與設定不受影響。

- **新增 Lock to Image**：選擇一個工作負載，讓它的容器只能執行 Image 本身帶有的執行檔，見 [Lock to Image](../features/image-lockdown.md)。它使用 `deploy/sentinel.yaml` 中既有的 Role 與 RoleBinding `sentinel-tetragon-exec`；若你先前刪除了這組權限，這個功能無法讀取 Image 的執行檔清單

從 v0.82 以前的版本升級時，請重新套用 `deploy/sentinel.yaml` 再重啟 K8s Sentinel，並確認 Tetragon、Cilium（Hubble Relay）與 Trivy Operator 都已依本章各頁面的方式設定。其他版本的升級說明，請以頁面上方的版本選單切換到該版本的文件。

```bash
kubectl apply -f deploy/sentinel.yaml
kubectl -n sentinel-system rollout restart deployment/sentinel
```

:::caution[重新套用 deploy/sentinel.yaml 會還原檔案中的設定]
若你曾**修改該檔案**來調整 Deployment 或 Service（以 PVC 取代 `emptyDir`、`AUDIT_WEBHOOK_TOKEN`、固定的 Image 版本、`NodePort`），請先把這些修改帶進新的檔案，或套用你自己的副本。

直接套用原始檔案時，資料 volume 會回到 `emptyDir`，也就是一個只有 `admin` / `admin` 帳號的全新 K8s Sentinel，檔案中設定的 audit webhook token 也會消失。以 `kubectl set env` 或 `kubectl patch` 做的修改，以及你自行指定的 `clusterIP`，則會保留。
:::
