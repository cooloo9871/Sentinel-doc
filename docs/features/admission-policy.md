---
id: admission-policy
title: Admission Policy
sidebar_position: 11
---

# Admission Policy

## 功能說明

Admission Policy 提供視覺化的 Kubernetes **ValidatingAdmissionPolicy（VAP）** 建立工具，讓使用者不需要手動撰寫 CEL 表達式，即可透過圖形化表單建立資源准入規則。所有透過 Sentinel 建立的 ValidatingAdmissionPolicy 會直接套用於 Kubernetes API Server，在資源被建立或更新時即時進行驗證攔截。

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

Sentinel 提供七種內建規則類型，可涵蓋常見的 Kubernetes 資源准入驗證需求：

| 規則類型 | 說明 |
|---|---|
| **Label Check** | 要求或拒絕具有特定 Label key=value 的資源 |
| **Annotation Check** | 要求或拒絕具有特定 Annotation 的資源 |
| **Image Policy** | 控制 Pod 允許使用的 Container Image Registry 或 Image 名稱 |
| **Replica Limit** | 限制 Deployment / StatefulSet 的最大或最小副本數 |
| **Resource Limits** | 要求 Container 必須設定 CPU / Memory Request 與 Limit |
| **Security Context** | 要求或拒絕特定的 Pod Security Context 設定（例如禁止 `runAsRoot`） |
| **Host Access** | 限制 Pod 使用 hostPID、hostNetwork、hostIPC 等主機資源共用設定 |

### 表單欄位說明

| 欄位 | 說明 |
|---|---|
| **Policy Name** | ValidatingAdmissionPolicy 資源名稱，需符合 Kubernetes 命名規範 |
| **Rule Type** | 選擇上述七種規則類型之一 |
| **Apply To** | 選擇此 Policy 適用的資源類型（Pod、Deployment、StatefulSet、DaemonSet、Job、CronJob 或全部） |
| **規則細節** | 依選擇的規則類型顯示對應的設定欄位 |

### YAML 即時預覽

表單右側提供 **Generated YAML** 即時預覽區，顯示根據表單設定自動產生的完整 `ValidatingAdmissionPolicy` YAML，方便確認 CEL 表達式與規則內容是否符合預期。

---

## 以 YAML 建立 Policy

若需要更精細的控制，可點擊「**+ New YAML**」按鈕，直接貼上完整的 `ValidatingAdmissionPolicy` YAML 定義進行建立。

---

## Bindings 管理

切換至「**Bindings**」標籤頁可管理 `ValidatingAdmissionPolicyBinding` 資源。

![Bindings 標籤頁](/img/features/admission-policy/bindings.png)

Binding 用於將已建立的 ValidatingAdmissionPolicy 綁定至特定的 Namespace 或資源，並設定違規時的行為（Deny / Warn / Audit）。

**執行原理：** Sentinel 透過 Kubernetes API Server 建立 `ValidatingAdmissionPolicy` 與 `ValidatingAdmissionPolicyBinding` 資源。API Server 在處理每個符合 `matchConstraints` 的資源請求時，會自動評估 CEL 表達式，驗證不通過時依 `failurePolicy` 設定決定拒絕或警告。

:::info
Admission Policy 需要 Kubernetes 1.26+ 並已啟用 `ValidatingAdmissionPolicy` feature gate（Kubernetes 1.28+ 預設啟用）。
:::
