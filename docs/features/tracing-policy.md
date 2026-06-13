---
id: tracing-policy
title: TracingPolicy 管理
sidebar_position: 2
---

# TracingPolicy 管理

## 功能說明

TracingPolicy 是 Cilium/Tetragon 定義的 Custom Resource Definition（CRD），用於描述應套用至 Pod 的安全規則。Sentinel 提供完整的 TracingPolicy 生命週期管理，支援兩種作用範圍：

- **Cluster-scoped**：套用至整個叢集的所有 Pod
- **Namespace-scoped**（TracingPolicyNamespaced）：僅套用至指定 Namespace 內的 Pod

---

## 查看 Policy 清單

進入「**TracingPolicy**」頁面後，所有已建立的 Policy 會以表格形式列出。

![TracingPolicy 列表頁](/img/features/policy/list.png)

表格欄位說明如下：

| 欄位 | 說明 |
|---|---|
| **Name** | TracingPolicy 的資源名稱 |
| **Scope** | 作用範圍：`cluster`（叢集層級）或 `namespaced`（Namespace 層級） |
| **Mode** | 執行模式：`Monitoring`（僅記錄）或 `Protect`（記錄並阻擋） |
| **Namespace** | Namespace-scoped Policy 所屬的 Namespace；Cluster-scoped 顯示為空白 |
| **Created By** | 建立此 Policy 的使用者帳號 |
| **Created Time** | Policy 建立的時間戳記 |
| **Actions** | 可對該 Policy 執行編輯（Edit）或刪除（Delete）操作 |

---

## 建立新 Policy

點擊列表頁右上角的「**+ New Policy**」按鈕，進入 Policy 建立頁面。

![建立 Policy 表單](/img/features/policy/create.png)

填寫表單欄位說明：

- **Policy Name**（必填）：TracingPolicy 的資源名稱，需符合 Kubernetes 命名規範（小寫英文、數字與連字號）
- **Namespace**：選擇此 Policy 套用的目標 Namespace；若留空則建立為 Cluster-scoped Policy
- **Mode**：選擇初始執行模式，建議初次部署時選擇 `Monitoring` 模式，觀察行為後再切換至 `Protect`

填寫完成後，點擊「**Save Changes**」儲存。

**建立原理：** Sentinel 根據表單填寫的內容自動產生對應的 TracingPolicyNamespaced YAML 結構，並透過 Kubernetes API Server 將資源建立至叢集中，Tetragon Agent 會在數秒內套用新策略。

---

## 切換 Global Protect Mode

TracingPolicy 頁面頂部包含一個 **Global Protect Mode** banner，可一次性切換叢集內所有 Policy 的執行模式。

![Global Protect Mode 切換區](/img/features/mode/monitoring.png)

**操作方式：**

1. 當 Global Protect Mode 為關閉狀態時，banner 會顯示「**Turn On**」按鈕
2. 點擊「Turn On」後，Sentinel 會批次更新叢集內所有 TracingPolicy 的 `mode` 欄位為 `Protect`
3. Tetragon Agent 收到 Policy 更新事件後立即生效，開始阻擋所有違反規則的行為

**關閉方式：** 再次點擊切換按鈕，Sentinel 會批次將所有 Policy 的 `mode` 欄位還原為 `Monitoring`，恢復為僅記錄模式，不再阻擋任何行為。
