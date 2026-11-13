---
id: registry-scanning
title: Registry 掃描（Registries）
sidebar_position: 12
---

# Registry 掃描（Registries）

## 功能說明

[Workloads](./vulnerabilities.md) 頁面涵蓋的是**正在執行**的 Image；「**Vulnerabilities → Registries**」（v0.62 起）涵蓋的是**可能被部署**的 Image：在任何工作負載使用之前，先掃描存放在 Registry 中的 Image。

Trivy Operator 只會查看叢集內的工作負載，因此這裡的掃描由 **K8s Sentinel 自行啟動**：每個 Image 在 `sentinel-system` 內以一個短命的 Trivy Pod 掃描。

支援的 Registry 類型：

| 類型 | URL 範例 |
|---|---|
| **Harbor** | `https://harbor.example.com` |
| **Docker Registry**（自架） | `https://registry.hub.docker.com` |
| **Quay**（quay.io） | `https://quay.io` |

:::note
此頁面只回報結果，目前也不會標示 Registry 中哪些 Image 正在叢集內執行。要依掃描結果拒絕 Image 的部署，請見 [以掃描結果阻擋部署](./vulnerability-admission.md)：Registry 掃描的結果正是讓 Image 在**第一次部署前**就能被檢查的來源。
:::

---

## 新增 Registry

進入「**Vulnerabilities → Registries**」，點擊右上角「**+ Add Registry**」（僅 Admin 可見）。

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Name** | ✅ | Registry 的顯示名稱 |
| **Registry type** | - | `Harbor` / `Docker Registry` / `Quay`；URL 欄位下方的範例會隨類型切換 |
| **URL** | ✅ | Registry 位址 |
| **Username** / **Password** | - | 選填的登入認證 |
| **Filters** | ✅ | 決定要掃描哪些 Image，見下一節 |
| **Scan every N days** | - | 排程間隔，1 到 30 天 |
| **Skip TLS certificate verification** | - | 接受任何憑證，也就是完全不檢查 Registry 的身分 |
| **CA certificate** | - | 貼上自有 CA 的 `ca.pem` 內容（v0.63+）；勾選略過驗證時此欄位會隱藏 |

點擊「**Save**」後，該 Registry 會立即開始第一次掃描。

![Add Registry 表單與 Test filters 結果](/img/features/registries/new.png)

### 使用自有 CA 簽發憑證的 Registry

v0.63 起不需要再勾選 **Skip TLS certificate verification**：把 CA 的 `ca.pem` 內容貼到 **CA certificate**，K8s Sentinel 列出 Registry 內容與掃描 Pod 拉取 Image 時，都會以這張 CA 驗證。這張 CA 是**加入**公開信任的 CA 清單，而不是取代，因此掃描仍可下載弱點資料庫。

---

## Filters 語法

Filters 的格式是 `repository` 或 `repository:tag`，以 `*` 作為萬用字元；可一行一個，也可用逗號分隔（v0.63.1+），例如 `library/*, team/*, ops/app:v1.*`。

| 範例 | 意義 |
|---|---|
| `library/*` | project `library` 下的所有 Image |
| `team/app` | 單一 repository 的所有 tag |
| `team/app:v1.*` | 該 repository 的 v1 系列 tag |
| `library/*:latest` | 各 repository 中有 `latest` tag 者 |

在 **Harbor** 與 **quay.io** 上，第一個斜線前的 project 或 organization 必須完整寫出，因為這是這兩種 Registry 能夠列舉的單位。

儲存前可先點擊「**Test filters**」：只列出 Registry 內容而不掃描，回報符合的 Image 數量與部分範例。

---

## 掃描排程與限制

| 項目 | 說明 |
|---|---|
| **觸發時機** | 新增時、每次編輯後、之後依設定的間隔（1 到 30 天）；也可隨時點擊「**Scan now**」 |
| **每次掃描上限 500 個 Image** | 每個 Image 都是一個需要下載弱點資料庫的 Pod，因此一次掃描到 500 個為止。Filters 符合的數量超過時，頁面會顯示有多少被略過；請縮小 Filters 範圍或拆成多筆 Registry |
| **同時執行 3 個掃描** | 所有 Registry 合計，因此大型 Registry 需要一段時間。結果隨每個 Image 完成而出現，在那之前仍保留上一次的結果 |
| **單一 Image 掃描上限 13 分鐘** | v0.63.3 起；先前沿用 Trivy 預設的 5 分鐘，較大的 Image 會以 `context deadline exceeded` 失敗 |

---

## 查看結果

![Registries 列表](/img/features/registries/list.png)

Registries 列表欄位為 `Registry`、`Filters`、`Schedule`、`Last scan`、`Images`、`Critical`、`High`、`Failed`，每列提供 **Scan now**、**Edit**、**Delete**。

點入單一 Registry 後可看到各 Image 的 `Critical` / `High` / `Medium` / `Low` / `Unknown` / `Fixable` 數量與掃描時間：

- **展開 Image** 查看弱點明細，版面與 Workloads 頁面相同，同樣由最嚴重的排起（v0.62.1+）
- **Search image...** 搜尋；**Severity** 與 **Show only**（`Fix available`、`Scan failed`）篩選
- **Export CSV** 匯出

![單一 Registry 的 Image 掃描結果](/img/features/registries/detail.png)

![展開 Image 的弱點明細](/img/features/registries/image-expanded.png)

### 掃描失敗不等於乾淨

- 單一 Image 掃描失敗時顯示 **Scan failed**、數量欄為「-」，展開可看到 Trivy 回報的原因，並在 `Failed` 欄另外計數，不會被當成沒有弱點的 Image
- 無法列出 Registry 內容，或掃描 Pod 無法執行（例如 Image 無法拉取）時，是該 **Registry** 顯示 **Scan failed** 與原因，並會在一小時內重試，而不是等到下一個完整間隔

---

## 認證與資料保存

- **認證資訊**與其他設定一起存放在 K8s Sentinel 的資料目錄，不會回傳給瀏覽器。掃描 Pod 從一個只為該 Pod 存在的 Secret 讀取認證，且只作為該 Registry 主機的登入資訊，因此密碼不會寫進 Job，也不會被送往 Trivy 下載資料庫的 Registry
- 修改 Registry 的 **URL** 時需要重新輸入密碼，避免已儲存的密碼被導向另一台主機
- **設定與掃描結果存放在資料目錄**（`registries.json` 與 `registry-scans/`）。掛載永久儲存時重啟後仍保留；使用預設 `emptyDir` 時，重啟會清空 Registry 設定與結果，見 [設定永久儲存](../installation/persistent-storage.md)
- **權限**：Viewer 可以查看結果；新增、編輯、刪除與啟動掃描僅限 Admin，且都會記錄在 [Audit Log](./audit-log.md)

---

## 前置需求

- `deploy/sentinel.yaml` 為 v0.62 以後的版本：其中的 Role `sentinel-registry-scan` 讓 K8s Sentinel 能在 `sentinel-system` 內建立掃描 Job；缺少時掃描會以權限錯誤失敗
- 若有安裝 Trivy Operator，需以目前的 `deploy/trivy-operator-values.yaml` 升級，Operator 才不會反過來掃描這些掃描 Job，見 [安裝 Trivy Operator](../installation/trivy-operator.md)
- 離線叢集需設定 `TRIVY_IMAGE`、`TRIVY_DB_REPOSITORY`、`TRIVY_JAVA_DB_REPOSITORY` 環境變數，同樣見上述頁面；以 [離線安裝](../installation/offline-install.md) 部署時已自動設定
