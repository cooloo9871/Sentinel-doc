---
id: admission-events
title: Admission Events
sidebar_position: 12
---

# Admission Events

## 功能說明

Admission Events 頁面記錄並呈現 Kubernetes **ValidatingAdmissionPolicy** 的違規事件。當叢集中的資源操作（建立或更新）違反已套用的 Admission Policy 規則時，API Server 會產生 Warning 事件，Sentinel 透過 Webhook 端點接收並儲存這些事件，供使用者即時查閱與審查。

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

## 設定 Webhook 接收事件

Admission Events 的資料來源為 Kubernetes Audit Webhook。需在 Kubernetes API Server 設定 Audit Webhook，將 Admission Policy 違規的 Warning 事件轉送至 Sentinel：

```
POST /api/admission-events/webhook
```

配置步驟請參考 Kubernetes 官方文件中關於 [Audit Webhook Backend](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/#webhook-backend) 的說明，將 Webhook URL 設定為 Sentinel 的 `/api/admission-events/webhook` 端點。

---

## 事件嚴重性

| 等級 | 說明 |
|---|---|
| **Warning** | 資源違反 Admission Policy 規則，但因 `failurePolicy: Warn` 設定仍被允許通過 |
| **Critical** | 資源因違反 Admission Policy 而被 API Server 拒絕（`failurePolicy: Fail`） |

---

:::info
Admission Events 的事件保留設定可在「**Settings → Event Retention**」頁面的「Admission Events」標籤頁中進行調整，包含最大事件數量與 TTL（保留天數）。
:::
