---
id: admission-events
title: Admission Events
sidebar_position: 12
---

# Admission Events

## 功能說明

Admission Events 頁面記錄並呈現 Kubernetes **ValidatingAdmissionPolicy** 的違規事件。事件有兩種來源：

- **Kubernetes Warning Events**（預設）：未做任何設定即可使用，但僅涵蓋會產生 Warning Event 的違規
- **Audit Webhook**（建議設定）：將 kube-apiserver 的 audit webhook 指向 K8s Sentinel 後可完整涵蓋所有違規，包含 `kubectl apply` 當下直接被拒絕的請求

頁面上的 **Source** 過濾器可辨別每筆事件來自哪個管線。

---

## 查看 Admission Events

進入「**Admission Events**」頁面後，所有已捕捉的 Admission 違規事件會以清單形式列出。

![Admission Events 頁面](/img/features/admission-events/list.png)

**頁面元素說明：**

| 元素 | 說明 |
|---|---|
| **事件統計** | 頁面頂部顯示總事件數、Warning 數量與 Critical 數量的統計摘要 |
| **搜尋框** | 輸入資源名稱或 Policy 名稱關鍵字，快速篩選事件 |
| **Namespace 選單** | 篩選特定 Namespace 的違規事件 |
| **事件類型選單** | 切換顯示所有事件或特定類型 |
| **來源選單** | 切換顯示來自 Audit Log 的事件 |

---

## 事件嚴重性

| 等級 | 說明 |
|---|---|
| **Warning** | 資源違反 Admission Policy 規則，但因 `failurePolicy: Warn` 設定仍被允許通過 |
| **Critical** | 資源因違反 Admission Policy 而被 API Server 拒絕（`failurePolicy: Fail`） |

---

## 設定 Kubernetes Audit Log

要取得完整的違規涵蓋（含 `kubectl apply` 直接被拒的請求），需在每台 control plane 節點上設定 kube-apiserver 的 Audit Policy 與 Webhook，並建議以 Token 保護 Webhook 端點。完整設定步驟請參考「安裝與部署」章節的 [串接 API Server Audit Log](../installation/audit-webhook.md)。

若此頁面持續沒有 `audit` 來源的事件，通常代表 Audit Webhook 尚未設定、設定有誤，或 Token 不一致（見設定頁的排查章節）。

---

:::info
Admission Events 的事件保留設定可在「**Settings → Event Retention**」頁面的「Admission Events」標籤頁中進行調整，包含最大事件數量與 TTL（保留天數）。
:::
