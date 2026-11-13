---
id: offline-install
title: 離線安裝（Air-gapped）
sidebar_position: 4
---

# 離線安裝（Air-gapped）

## 適用情境

叢集無法連上網際網路時，[Kubernetes Job 安裝](./job-install.md) 與 [本機腳本安裝](./script-install.md) 都無法使用，因為兩者都需要從 GitHub、Helm repository 與公開 Registry 下載內容。

v0.71.0 起，每一個 [release](https://github.com/cooloo9871/K8s_Sentinel/releases) 都附帶兩個檔案：

| 檔案 | 內容 |
|---|---|
| `sentinel-images-<版本>.txt` | 該版本需要的所有 Image：K8s Sentinel、Tetragon、Trivy Operator、Trivy，以及 Trivy 的兩個弱點資料庫 |
| `sentinel-offline-<版本>.tar.gz` | Manifest 與腳本。不含 Image，因此檔案很小 |

離線套件只會安裝 Image 清單所列的版本：Tetragon 與 Trivy Operator 在 release 建置時就已經從各自的 chart 轉成 manifest，因此**叢集端只需要 `kubectl`，不需要 Helm**。

整個流程分為三步：

1. 在可連網的機器上下載離線套件並儲存 Image
2. 把整個目錄帶到離線環境，將 Image 推送到叢集節點可拉取的私有 Registry
3. 以 `install.sh --registry` 安裝

---

## 開始之前

| 項目 | 說明 |
|---|---|
| **私有 Registry** | 叢集節點可以拉取的 Registry（例如 Harbor）。使用 Harbor 時，請先建立要存放 Image 的 project（下方範例為 `sentinel`） |
| **不需認證即可拉取** | 節點與 Trivy 都必須能在**沒有認證**的情況下從該 Registry 拉取。離線套件不會設定 image pull secret |
| **節點信任 Registry 的憑證** | 這是每個節點上 container runtime 的設定（containerd 的 `certs.d`），離線套件不會更動。若其他工作負載已經從這個 Registry 拉取 Image，表示已經設定完成 |
| **搬運 Image 的工具** | `mirror-images.sh` 優先使用 `skopeo`。沒有 `skopeo` 時改用 `docker`、`podman` 或 `nerdctl` 搬運 Image，但這三者無法搬運 Trivy 的弱點資料庫：資料庫是 OCI artifact 而不是 container image，需要 `skopeo` 或 `oras` |
| **CPU 架構** | Image 是依執行 `save` 那台機器的 CPU 架構儲存的，請在與叢集節點相同架構的機器上執行 |
| **叢集前置需求** | 與線上安裝相同：Kubernetes 1.32+、Cilium（啟用 kube-proxy replacement 與 Hubble），見 [前置需求](../prerequisites.md)。Cilium 不在離線套件內，需自行以離線方式安裝 |

:::caution[沒有弱點資料庫就無法掃描]
Registry 中缺少 Trivy 的兩個資料庫時，K8s Sentinel 仍可安裝並正常運作，但**沒有任何 Image 能被掃描**。請確認執行 `mirror-images.sh` 的機器上有 `skopeo` 或 `oras`。
:::

---

## 步驟一：在可連網的機器上下載並儲存 Image

從 release 頁面下載離線套件（以下以 v0.72.0 為例，請換成要安裝的版本）：

```bash
curl -LO https://github.com/cooloo9871/K8s_Sentinel/releases/download/v0.72.0/sentinel-offline-v0.72.0.tar.gz
tar xzf sentinel-offline-v0.72.0.tar.gz
cd sentinel-offline-v0.72.0
bash mirror-images.sh save        # 約 2 GB，存入 ./images
```

套件解開後的內容：

| 檔案 | 用途 |
|---|---|
| `images.txt` | Image 清單，與 release 上的 `sentinel-images-<版本>.txt` 相同 |
| `mirror-images.sh` | 儲存（`save`）與推送（`push`）Image |
| `install.sh` | 離線安裝腳本 |
| `uninstall.sh` | 解除安裝腳本，見 [解除安裝](../uninstall.md) |
| `manifests/` | `sentinel.yaml`、`tetragon.yaml`、`tetragon-grpc-policy.yaml`、`trivy-operator.yaml` |
| `VERSION` | 套件版本 |

以 v0.72.0 為例，`images.txt` 列出的內容為：

```text
ghcr.io/cooloo9871/sentinel:v0.72.0
mirror.gcr.io/aquasec/trivy:0.76.1
mirror.gcr.io/aquasec/trivy-operator:0.36.1
quay.io/cilium/hubble-export-stdout:v1.1.1
quay.io/cilium/tetragon-operator:v1.8.0
quay.io/cilium/tetragon:v1.8.0
# artifacts
mirror.gcr.io/aquasec/trivy-db:2
mirror.gcr.io/aquasec/trivy-java-db:1
```

最後兩項是 Trivy 的弱點資料庫（OCI artifact）。

---

## 步驟二：把 Image 推送到私有 Registry

把整個 `sentinel-offline-<版本>` 目錄（含 `images/`）帶到離線環境，在可以連到 Registry 的機器上執行：

```bash
bash mirror-images.sh push harbor.example.com/sentinel
```

Registry 參數是「主機加路徑」，不含 `http://` 或 `https://`。

**Image 在 Registry 中保留原本的路徑**，只把最前面的 Registry 主機換掉：

| 原始位置 | 推送後的位置 |
|---|---|
| `quay.io/cilium/tetragon:v1.8.0` | `harbor.example.com/sentinel/cilium/tetragon:v1.8.0` |
| `ghcr.io/cooloo9871/sentinel:v0.72.0` | `harbor.example.com/sentinel/cooloo9871/sentinel:v0.72.0` |
| `mirror.gcr.io/aquasec/trivy-db:2` | `harbor.example.com/sentinel/aquasec/trivy-db:2` |

同一台機器若能同時連到網際網路與 Registry，可以一次完成：

```bash
bash mirror-images.sh save && bash mirror-images.sh push harbor.example.com/sentinel
```

`mirror-images.sh` 可用的環境變數：

| 環境變數 | 說明 |
|---|---|
| `INSECURE=1` | 推送到使用 HTTP、或憑證不被這台機器信任的 Registry。這只影響推送的這台機器，**不會改變叢集信任什麼**。`docker` 沒有對應的開關，需把該 Registry 列在 daemon 設定的 `insecure-registries` |
| `CONTAINER_CLI` | 指定要使用的指令，取代自動偵測的 `docker` / `podman` / `nerdctl`，例如 `CONTAINER_CLI="sudo podman"` |
| `IMAGES_DIR` | Image 的存放目錄，預設為套件內的 `./images` |

---

## 步驟三：安裝

在可以用 `kubectl` 存取叢集的機器上執行：

```bash
bash install.sh --registry harbor.example.com/sentinel
```

腳本會把 manifest 中的每一個 Image 改寫為私有 Registry 的位置，再依序執行：

1. **Tetragon**：叢集任一 Namespace 已有 Tetragon DaemonSet 時跳過；否則套用 `tetragon.yaml` 並等待就緒。接著套用 NetworkPolicy `tetragon-grpc`
2. **K8s Sentinel**：套用 `sentinel.yaml` 並等待 Deployment 就緒
3. **Trivy Operator**：叢集任一 Namespace 已有 Trivy Operator 時跳過；否則安裝至 `sentinel-system`

與線上安裝程式相同，**叢集中既有的 Tetragon 或 Trivy Operator 不會被更動**。既有的 Tetragon 需要自行設定 K8s Sentinel 所需的 gRPC 位址，見 [安裝 Tetragon](./tetragon-install.md)。

| 選項 | 說明 |
|---|---|
| `--registry <主機/路徑>` | 必填。`mirror-images.sh push` 推送的位置 |
| `--render-only <目錄>` | 把將要套用的 manifest 寫入該目錄，**不套用任何內容**。適合先檢視，或以自己的方式套用 |
| `--insecure-registry` | v0.72.0+。Registry 的憑證由自有 CA 簽發、或使用 HTTP 時使用，見下一節 |

離線套件中的 K8s Sentinel 與線上安裝有三處不同：

- Image 固定為該 release 的版本標籤，而不是 `latest`；`imagePullPolicy` 為 `IfNotPresent`
- Deployment 已設定 `TRIVY_IMAGE`、`TRIVY_DB_REPOSITORY`、`TRIVY_JAVA_DB_REPOSITORY`，因此 [Registry 掃描](../features/registry-scanning.md) 會使用與 Trivy Operator 相同的 Trivy 與資料庫，同樣指向私有 Registry
- Tetragon 與 Trivy Operator 是以 manifest 套用，叢集中沒有 Helm release

安裝完成後的存取方式與線上安裝相同：

```bash
kubectl port-forward -n sentinel-system svc/sentinel 8080:80
```

接著請依 [首次登入](../login.md) 變更預設密碼，正式環境並請完成 [設定永久儲存](./persistent-storage.md)。

---

## Registry 使用自有 CA 或 HTTP

節點與 Trivy 是**分開**信任 Registry 的：

| 誰在拉取 | 依據什麼信任 Registry |
|---|---|
| 節點的 container runtime（拉取所有 Pod 的 Image） | 節點自己的設定（containerd 的 `certs.d`）。離線套件與 `--insecure-registry` 都不會處理這一項 |
| Trivy（下載弱點資料庫、讀取要掃描的 Image） | Trivy 在 Pod 內執行，**不使用節點的設定**。憑證必須來自公開 CA，否則要以 `--insecure-registry` 安裝 |

```bash
bash install.sh --registry harbor.example.com/sentinel --insecure-registry
```

加上 `--insecure-registry`（v0.72.0+）後，Trivy 下載資料庫與讀取要掃描的 Image 時都**不驗證憑證**。

:::warning
這會關閉 Trivy **所有**的憑證驗證，包含它掃描的其他 Registry，而不只是存放資料庫的這一台。
:::

對應到 K8s Sentinel 自己的 Registry 掃描，`--insecure-registry` 會在 Deployment 上設定環境變數 `TRIVY_INSECURE=true`。

---

## 更新弱點資料庫

弱點資料庫每天更新，但離線環境中的掃描只認得**儲存資料庫當天以前**公布的弱點。請排程定期重新執行 `save` 與 `push`，更新私有 Registry 中的副本。

---

## 升級

升級與安裝相同：下載新版 release 的離線套件，重新執行上述三個步驟。

`install.sh` 會重新套用 K8s Sentinel 的 manifest，因此 [安裝概覽](./index.md) 中「重新套用 `deploy/sentinel.yaml`」的注意事項在這裡同樣適用：若你曾修改 Deployment 或 Service（例如改掛 PVC、改為 NodePort），請先用 `--render-only` 產生 manifest，把修改帶進去之後再套用。

---

## 解除安裝

使用離線套件內的 `uninstall.sh`，選項與行為見 [解除安裝](../uninstall.md)：

```bash
bash uninstall.sh --dry-run
bash uninstall.sh
```

---

## 自行建置離線套件

需要自行產生離線套件時（例如尚未發佈的版本），可在可連網且有 Helm 的機器上，於 K8s Sentinel 原始碼目錄執行：

```bash
bash deploy/offline/build.sh v0.72.0
```

產出的兩個檔案位於 `dist/`。Tetragon 與 Trivy Operator 的 chart 版本定義在 `deploy/offline/versions.env`。
