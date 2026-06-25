---
id: behavior-discovery
title: 行為發現（Behavior Discovery）
sidebar_position: 6
---

# 行為發現（Behavior Discovery）

## 功能說明

Behavior Discovery 是 Sentinel 的自動化學習功能，能夠在不預先建立任何 TracingPolicy 的情況下，自動收集並分析叢集中各 Pod 的實際執行行為（process 呼叫），讓您基於真實的工作負載行為來建立精準的安全策略，而非靠人工猜測應該允許哪些程式。

---

## 運作原理

Tetragon 安裝後，其 **base sensor**（基礎感測器）會預設啟動並記錄叢集內所有 Pod 的 process 事件，包含每個 process 的執行路徑、呼叫的父程序以及所屬的 Namespace 與 Pod 資訊。Sentinel 持續收集這些原始事件，並依工作負載（Deployment / DaemonSet / Pod）進行分組與統計。

此功能不需要事先建立 TracingPolicy，即可在背景持續累積觀察資料。

---

## 查看 Behavior Discovery 頁面

進入「**Behavior Discovery**」頁面後，觀察結果會以卡片網格形式呈現，每張卡片代表一個工作負載。

![Behavior Discovery 頁面](/img/features/discovery/overview.png)

**頁面元素說明：**

| 元素 | 說明 |
|---|---|
| **統計列** | 右上方顯示「N workloads · N pods total」，提供目前觀察到的工作負載與 Pod 總數 |
| **Namespace 選單** | 選擇特定 Namespace 縮小顯示範圍 |
| **Search pod...** | 輸入 Pod 名稱關鍵字，快速篩選包含該 Pod 的工作負載卡片 |
| **Group by namespace** | 切換是否依 Namespace 分組顯示卡片 |
| **Clear All** | 清除所有已累積的 Behavior Discovery 觀察資料，重新開始學習 |

**工作負載卡片說明：**

每張卡片包含以下資訊：

- **資源類型標籤**：`Deployment`、`DaemonSet` 或 `Pod`
- **工作負載名稱**：Deployment / DaemonSet / Pod 的名稱
- **Namespace · Pod 數量**：所屬 Namespace 與受管理的 Pod 數
- **Process 列表**：觀察期間偵測到的不重複執行檔路徑（顯示二進位名稱，滑鼠懸停可見完整路徑）及各路徑的執行次數
- **since X ago**：本卡片的觀察資料從多久前開始累積

---

## 從行為發現結果建立 Policy

確認工作負載的行為摘要符合預期後，可直接從 Behavior Discovery 頁面一鍵產生 TracingPolicy。

![Create Policy 按鈕](/img/features/discovery/generate-policy.png)

**操作步驟：**

1. 在卡片網格中找到目標工作負載卡片
2. 點擊卡片右上角的「**Create Policy**」按鈕
3. Sentinel 自動根據觀察到的 process 清單產生一份 TracingPolicy 草稿，並帶入至 Policy 編輯頁面供您審閱與調整
4. 確認規則無誤後，點擊「**Save Changes**」儲存並套用

**執行原理：** Sentinel 根據觀察期間記錄到的所有不重複 process 執行路徑，自動產生一條採用 **NotPostfix — Whitelist** 模式的 TracingPolicy，僅允許這些已被觀察且認定為正常的執行路徑。任何未曾出現的程式，在切換至 Protect 模式後都將被阻擋執行。

---

:::tip
建議讓工作負載在完整的正常業務流程下持續運行 **24 至 48 小時**後，再從 Behavior Discovery 的觀察結果建立 Policy。過短的觀察期可能遺漏部分合法但不常執行的程式（例如排程任務、備份腳本），導致 Whitelist 不完整，切換至 Protect 模式後誤擋正常服務。
:::
