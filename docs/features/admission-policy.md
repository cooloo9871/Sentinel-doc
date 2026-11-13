---
id: admission-policy
title: Admission Policy
sidebar_position: 11
---

# Admission Policy

## 功能說明

Admission Policy 提供視覺化的 Kubernetes **ValidatingAdmissionPolicy（VAP）** 建立工具，讓使用者不需要手動撰寫 CEL 表達式，即可透過圖形化表單建立資源准入規則。所有透過 K8s Sentinel 建立的 ValidatingAdmissionPolicy 會直接套用於 Kubernetes API Server，在資源被建立或更新時即時進行驗證攔截。

---

## 頁面結構

Admission Policy 頁面分為兩個標籤頁：

- **Policies**：列出叢集中所有 ValidatingAdmissionPolicy 資源
- **Bindings**：列出所有 ValidatingAdmissionPolicyBinding 資源，用於將 Policy 綁定至特定 Namespace 或資源

![Admission Policy 列表頁](/img/features/admission-policy/list.png)

---

## 建立新 Policy

點擊頁面右上角的「**+ New Policy**」按鈕，進入圖形化建立介面。

![建立 Admission Policy 表單](/img/features/admission-policy/new-form.png)

### 支援的規則類型

K8s Sentinel 提供十四種內建規則類型，從「**Rule Type**」下拉選單選擇（v0.66.1 起由一排按鈕改為下拉選單）：

![Rule Type 下拉選單中的十四種規則類型](/img/features/admission-policy/rule-types.png)

| 規則類型 | 說明 |
|---|---|
| **Label Check** | 要求或拒絕具有特定 Label key=value 的資源，可多條規則 |
| **Annotation Check** | 要求或拒絕具有特定 Annotation 的資源 |
| **Image Policy** | 禁止 `:latest` 標籤、要求 Image 來自指定 Registry。v0.59 起涵蓋 **initContainers 與 ephemeral（debug）containers**，Registry 前綴比對不分大小寫，帶 port 的 Registry（`myreg:5000/app`）無標籤時也會被正確拒絕 |
| **Replica Limit** | 限制 Deployment / StatefulSet 的副本數上限。v0.59 起 **`kubectl scale` 與 HPA 經由 scale 子資源的調整同樣受限** |
| **Resource Limits** | 要求 Container 必須設定 CPU / Memory Limit，涵蓋所有工作負載類型與 initContainers。v0.68 起可另外設定 **Max CPU limit** 與 **Max memory limit** 上限（以 Kubernetes 的數量寫法填寫，如 `2`、`500m`、`4Gi`）；設定上限後，超過上限或**沒有設定該項 Limit** 的 Container 都會被拒絕 |
| **Security Context** | 禁止 privileged 容器、要求 runAsNonRoot（尊重 Pod 與 Container 層級的繼承）。v0.59 起涵蓋 ephemeral（debug）containers。v0.68 起可要求 `allowPrivilegeEscalation: false`（**No Privilege Escalation**）；此欄位必須明確寫出，因為未設定即代表允許 |
| **Host Access** | 禁止 hostNetwork、hostPID、hostIPC 等主機資源共用設定 |
| **ConfigMap Size**（v0.55+） | 限制 ConfigMap 的**總大小**（KB，`data` 與 `binaryData` 合計、含 key 名稱）。新物件必須符合上限；既有超標物件可維持或縮小但**不可再成長** |
| **Secret Size**（v0.57+） | 同樣的總大小上限套用於 Secret，`data` 以 base64 **解碼後**的實際大小計算；受管型別（`kubernetes.io/service-account-token`、`bootstrap.kubernetes.io/token`、`helm.sh/release.v1`）自動豁免 |
| **Vulnerability Limit**（v0.66+） | 拒絕 Critical 或 High 弱點數量超過上限的 Image，依據 K8s Sentinel 自己的掃描結果。見 [以掃描結果阻擋部署](./vulnerability-admission.md) |
| **Blocked CVEs**（v0.68+） | 拒絕含有指定弱點編號的 Image，不論嚴重性。見 [以掃描結果阻擋部署](./vulnerability-admission.md) |
| **Scanned Images**（v0.70+） | 拒絕 K8s Sentinel 沒有掃描結果的 Image。見 [以掃描結果阻擋部署](./vulnerability-admission.md) |
| **Host Path Volumes**（v0.68+） | 禁止 `hostPath` volume：全部（**Every hostPath volume**），或只禁止會觸及指定路徑者。指定 `/var/run` 時，`/var/run/docker.sock` 會被拒絕，包含它的 `/var` 與 `/`，以及刻意規避比對的寫法（`//var/run`）也會被拒絕 |
| **Environment Variables**（v0.68+） | 要求每個 Container 都必須有指定的環境變數（**Required in every container**），並禁止其他變數（**Not allowed**），兩者都以逗號分隔。禁止的名稱採**完整比對、不分大小寫**（`pass` 會拒絕 `PASS` 與 `Pass`，但不會拒絕 `DB_PASS`）；必要的名稱則必須完全相同 |

### 表單欄位說明

| 欄位 | 說明 |
|---|---|
| **Policy Name** | ValidatingAdmissionPolicy 資源名稱，需符合 Kubernetes 命名規範 |
| **Rule Type** | 從下拉選單選擇上述十四種規則類型之一 |
| **Apply To** | 選擇此 Policy 適用的資源類型（All Workloads、Pod、Deployment、StatefulSet、DaemonSet、Job、CronJob，v0.59 起含 Namespaces）；工作負載規則同時涵蓋 ReplicationController |
| **規則細節** | 依選擇的規則類型顯示對應的設定欄位；Violation Message 留空時使用具體的預設訊息（欄位的 placeholder 會即時預覽） |

:::note[已知的涵蓋範圍限制]
- Size 規則對超過 200 個 key 的物件會跳過驗證（成本上限保護，避免大物件在 `failurePolicy: Fail` 下永遠無法更新）
- Security Context 規則不涵蓋以 `capabilities` 取得的特權；Host Access 規則不涵蓋 `hostPort`
- Host Path Volumes 規則不檢查其他類型的 volume，也不會追蹤節點上的符號連結
- Environment Variables 規則看不到 Container 以 `envFrom` 取得的變數，因為那些名稱存放在 Policy 讀不到的 ConfigMap 或 Secret 中；禁止的名稱會一併檢查 init 與 ephemeral containers
:::

### YAML 即時預覽

表單右側提供 **Generated YAML** 即時預覽區，顯示根據表單設定自動產生的完整 `ValidatingAdmissionPolicy` YAML，方便確認 CEL 表達式與規則內容是否符合預期。

---

## 以 YAML 建立 Policy

若需要更精細的控制，可點擊「**+ New YAML**」按鈕，直接貼上完整的 `ValidatingAdmissionPolicy` YAML 定義進行建立。

:::note[Edit 的開啟方式]
以表單建立的 Policy，點擊 `Edit` 會重新以**表單**開啟（kube-apiserver 自動補上的預設欄位如 `matchPolicy: Equivalent` 不影響判定）；以 `kubectl apply` 建立、或包含表單無法呈現之非預設設定的 Policy，則以 **YAML 編輯器**開啟，避免表單儲存時抹掉這些設定。Bindings 的行為相同。
:::

:::caution[v0.69 以前建立的四種規則]
在 v0.69 以前建立的 **Vulnerability Limit**、**Blocked CVEs**、**Host Path Volumes** 與 **Environment Variables** Policy 會照原本的內容繼續運作，但 `Edit` 會以 YAML 編輯器開啟。請在表單中**重新建立**以取得修正後的規則，其中前兩種尤其重要：舊版規則可以被「自行宣告 owner 的 manifest」繞過。
:::

---

## Bindings 管理

切換至「**Bindings**」標籤頁可管理 `ValidatingAdmissionPolicyBinding` 資源。

![Bindings 標籤頁](/img/features/admission-policy/bindings.png)

Binding 用於將已建立的 ValidatingAdmissionPolicy 綁定至指定範圍，並設定違規時的行為（Deny / Audit / Warn）。

**Namespace 範圍**（v0.54+）支援三種模式，皆可**多選**：

| 模式 | 說明 |
|---|---|
| **All namespaces** | 不過濾，全叢集生效（提示會註明包含 `kube-system`） |
| **Only these namespaces** | 僅在勾選的 Namespace 生效（`matchExpressions` 的 `In`） |
| **All except these namespaces** | 除勾選外全部生效（`NotIn`），例如排除 `kube-system` / `kube-public` / `kube-node-lease` 的經典全叢集防護 |

:::tip
搭配 ConfigMap / Secret Size 規則時，建議使用「All except」排除 `kube-system` 等系統 Namespace，避免影響 kubelet 與控制器的系統性寫入。
:::

**執行原理：** K8s Sentinel 透過 Kubernetes API Server 建立 `ValidatingAdmissionPolicy` 與 `ValidatingAdmissionPolicyBinding` 資源。API Server 在處理每個符合 `matchConstraints` 的資源請求時，會自動評估 CEL 表達式，驗證不通過時依 `failurePolicy` 設定決定拒絕或警告。

:::info
Admission Policy 需要 Kubernetes 1.26+ 並已啟用 `ValidatingAdmissionPolicy` feature gate（Kubernetes 1.28+ 預設啟用）。
:::
