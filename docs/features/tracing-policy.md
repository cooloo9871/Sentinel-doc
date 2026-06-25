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

進入「**Tracing Policy**」頁面後，所有已建立的 Policy 會以表格形式列出。

![TracingPolicy 列表頁](/img/features/policy/list.png)

**頂部篩選器：**

| 篩選器 | 說明 |
|---|---|
| **Search policy name...** | 輸入關鍵字即時篩選 Policy 名稱 |
| **All Scopes** | 依作用範圍篩選：全部 / cluster / namespaced |
| **All Namespaces** | 依 Namespace 篩選 Namespace-scoped Policy |

**表格欄位說明：**

| 欄位 | 說明 |
|---|---|
| **Name** | TracingPolicy 的資源名稱 |
| **Scope** | 作用範圍：`cluster`（叢集層級）或 `namespaced`（Namespace 層級） |
| **Mode** | 執行模式下拉選單：可直接在列表中切換 `Monitoring` 或 `Protect`，無需進入編輯頁 |
| **Namespace** | Namespace-scoped Policy 所屬的 Namespace；Cluster-scoped 顯示「-」 |
| **Created By** | 建立此 Policy 的使用者帳號 |
| **Created Time** | Policy 建立的完整時間戳記 |
| **Actions** | `Edit`（進入編輯頁面）與 `Delete`（刪除）按鈕 |

:::tip
**Mode 支援 inline 切換**：直接點擊列表中 Mode 欄位的下拉選單即可切換 Monitoring / Protect，Tetragon Agent 會在數秒內套用，無需進入編輯頁面。
:::

---

## 建立新 Policy

點擊列表頁右上角的「**+ New Policy**」按鈕，進入 Policy 建立頁面。

![建立 Policy 表單](/img/features/policy/create.png)

頁面分為左側的 **Form / YAML** 標籤編輯區與右側的 **YAML Preview** 即時預覽區。

**頁面頂部設定：**

- **Policy Name**（必填）：TracingPolicy 的資源名稱，需符合 Kubernetes 命名規範（小寫英文、數字與連字號）
- **Namespace**：選擇目標 Namespace；選 cluster scope 或留空則建立 Cluster-scoped Policy
- **Mode**（頁面右上角下拉）：選擇初始執行模式；建議初次部署選 `Monitoring`，觀察行為後再切換至 `Protect`

填寫完成後，點擊「**Save Changes**」儲存。

**建立原理：** Sentinel 根據表單內容自動產生對應的 TracingPolicy YAML，並透過 Kubernetes API Server 將資源建立至叢集，Tetragon Agent 會在數秒內套用新策略。

---

## 切換 Global Protect Mode

TracingPolicy 頁面頂部包含一個 **Global Protect Mode** banner，可一次性切換叢集內所有 Policy 的執行模式。

![Global Protect Mode 切換區](/img/features/mode/monitoring.png)

| 狀態 | Banner 文字 | 說明 |
|---|---|---|
| **OFF（預設）** | "Protect mode is off — monitoring only, no blocking" | 所有 Policy 僅記錄事件，不阻擋行為 |
| **ON** | "Protect mode is on — all policies are enforcing" | 所有 Policy 同時進入 Protect 模式 |

點擊「**Turn On**」後，Sentinel 後端批次更新叢集內所有 TracingPolicy 的 `mode` 欄位為 `Protect`；再次點擊「**Turn Off**」則批次還原為 `Monitoring`。

:::warning
開啟 Global Protect Mode 前，請確認所有 Policy 規則已充分驗證。若 Whitelist 遺漏必要的執行路徑，切換後可能導致正常服務被阻擋。建議先逐條 Policy 切換確認無誤，再啟用全域切換。
:::
