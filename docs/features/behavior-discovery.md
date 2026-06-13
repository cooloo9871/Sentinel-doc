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

Tetragon 安裝後，其 **base sensor**（基礎感測器）會預設啟動並記錄叢集內所有 Pod 的 process 事件，包含每個 process 的執行路徑、呼叫的父程序以及所屬的 Namespace 與 Pod 資訊。Sentinel 持續收集這些原始事件，並依工作負載（Deployment / DaemonSet）進行分組與統計，彙整成可讀的行為摘要，方便使用者審閱。

此功能不需要事先建立 TracingPolicy，即可在背景持續累積觀察資料。

---

## 查看 Behavior Discovery 頁面

進入「**Behavior Discovery**」頁面後，觀察結果會以卡片網格（card grid）形式呈現，每張卡片代表一個工作負載（Deployment 或 DaemonSet）。

![Behavior Discovery 頁面](/img/features/discovery/overview.png)

**頁面元素說明：**

- **工作負載卡片**：每張卡片顯示該工作負載的名稱、所屬 Namespace，以及觀察期間偵測到的不重複 process 執行路徑清單
- **Namespace 篩選器**：位於頁面頂部，可選擇特定 Namespace 以縮小顯示範圍，專注於特定應用程式
- **搜尋框**：輸入工作負載名稱關鍵字，快速定位目標工作負載

---

## 從行為發現結果建立 Policy

確認工作負載的行為摘要符合預期後，可直接從 Behavior Discovery 頁面一鍵產生 TracingPolicy。

![Create Policy 按鈕標注](/img/features/discovery/generate-policy.png)

**操作步驟：**

1. 在卡片網格中找到目標工作負載
2. 點擊該卡片上的「**Create Policy**」按鈕
3. Sentinel 會自動產生一份 TracingPolicy 草稿，並帶入至 Policy 編輯頁面供您審閱與調整
4. 確認規則內容無誤後，點擊「**Save Changes**」儲存並套用

**執行原理：** Sentinel 根據觀察期間記錄到的所有不重複 process 執行路徑，自動產生一條採用 **NotPostfix（Whitelist）** 模式的 TracingPolicy，僅允許這些已被觀察到且認定為正常的執行檔路徑。任何未曾在觀察期間出現的程式，在切換至 Protect 模式後都將被阻擋執行。

---

:::tip
建議讓工作負載在完整的正常業務流程下持續運行 **24 至 48 小時**後，再從 Behavior Discovery 的觀察結果建立 Policy。過短的觀察期可能遺漏部分合法但不常執行的程式（例如排程任務、備份腳本），導致 Whitelist 不完整，切換至 Protect 模式後誤擋正常服務。
:::
