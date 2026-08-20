---
id: tracing-policy
title: TracingPolicy 管理
sidebar_position: 2
---

# TracingPolicy 管理

## 功能說明

TracingPolicy 是 Cilium/Tetragon 定義的 Custom Resource Definition（CRD），用於描述應套用至 Pod 的安全規則。K8s Sentinel 提供完整的 TracingPolicy 生命週期管理，支援兩種作用範圍：

- **Cluster-scoped**：套用至整個叢集的所有 Pod
- **Namespace-scoped**（TracingPolicyNamespaced）：僅套用至指定 Namespace 內的 Pod

---

## 查看 Policy 清單

進入「**Tracing Policy**」頁面後，所有已建立的 Policy 會以表格形式列出。

![TracingPolicy 列表頁](/img/features/policy/list.png)

**頂部工具列：**

| 元素 | 說明 |
|---|---|
| **Search by name...** | 輸入關鍵字即時篩選 Policy 名稱 |
| **All namespaces** | 依 Namespace 篩選 Namespace-scoped Policy |
| **Refresh** | 重新查詢最新的 Policy 清單 |
| **+ New Policy / + New YAML** | 分別以表單編輯器或 YAML 編輯器建立新 Policy |

**表格欄位說明：**

| 欄位 | 說明 |
|---|---|
| **Name** | TracingPolicy 的資源名稱 |
| **Scope** | 作用範圍：`cluster`（叢集層級）或 `namespaced`（Namespace 層級） |
| **Mode** | 執行模式下拉選單：可直接在列表中切換 `Monitoring` 或 `Protect`，無需進入編輯頁 |
| **Namespace** | Namespace-scoped Policy 所屬的 Namespace；Cluster-scoped 顯示「-」 |
| **Created By** | 建立此 Policy 的使用者帳號；以 `kubectl apply` 建立的 Policy 顯示 `k8s-apply` |
| **Created Time** | Policy 建立的完整時間戳記 |
| **Actions** | `Edit`（進入編輯頁面）與 `Delete`（刪除）按鈕 |

:::note Edit 的開啟方式（v0.39.6+）
- **K8s Sentinel 建立的 Policy**：表單能呈現時以表單編輯器開啟，否則以 YAML 編輯器開啟
- **`kubectl apply` 建立的 Policy**（Created By 為 `k8s-apply`）：一律直接以 **YAML 編輯器**開啟，顯示原作者撰寫的 YAML，避免表單儲存時改寫欄位順序、引號與註解，導致 Git 中的檔案與叢集內容不一致
:::

:::tip
**Mode 支援 inline 切換**：直接點擊列表中 Mode 欄位的下拉選單即可切換 Monitoring / Protect，Tetragon Agent 會在數秒內套用，無需進入編輯頁面。
:::

---

## 建立新 Policy

K8s Sentinel 提供兩種建立方式：

- 「**+ New Policy**」：圖形化表單編輯器，左側填寫規則、右側 **Generated YAML** 即時預覽（詳見[表單編輯器](./form-editor.md)）
- 「**+ New YAML**」：全螢幕 YAML 編輯器，直接撰寫完整的 TracingPolicy 定義（詳見 [YAML 編輯器](./yaml-editor.md)）

![建立 Policy 表單](/img/features/policy/create.png)

**共同設定：**

- **Policy Name**（必填）：TracingPolicy 的資源名稱，需符合 Kubernetes 命名規範（小寫英文、數字與連字號）
- **Namespace**：選擇目標 Namespace 建立 `TracingPolicyNamespaced`；選 **cluster-wide** 則建立套用全叢集的 `TracingPolicy`
- **Mode**（頁面右上角下拉）：選擇初始執行模式；建議初次部署選 `Monitoring`，觀察行為後再切換至 `Protect`

填寫完成後，點擊「**Apply**」套用。

**建立原理：** K8s Sentinel 根據表單內容自動產生對應的 TracingPolicy YAML，並透過 Kubernetes API Server 將資源建立至叢集，Tetragon Agent 會在數秒內套用新策略。

---

## 切換 Global Protect Mode

TracingPolicy 頁面頂部包含一個 **Global Protect Mode** banner，可一次性切換叢集內所有 Policy 的執行模式。

![Global Protect Mode 切換區](/img/features/mode/monitoring.png)

| 狀態 | Banner 文字 | 說明 |
|---|---|---|
| **OFF（預設）** | "Protect mode is off - monitoring only, no blocking" | 所有 Policy 僅記錄事件，不阻擋行為 |
| **ON** | "Protect mode is on - all policies are enforcing" | 所有 Policy 同時進入 Protect 模式 |

點擊「**Turn On**」後，K8s Sentinel 後端批次更新叢集內所有 TracingPolicy 的 `mode` 欄位為 `Protect`；再次點擊「**Turn Off**」則批次還原為 `Monitoring`。

:::warning
開啟 Global Protect Mode 前，請確認所有 Policy 規則已充分驗證。若 Whitelist 遺漏必要的執行路徑，切換後可能導致正常服務被阻擋。建議先逐條 Policy 切換確認無誤，再啟用全域切換。
:::
