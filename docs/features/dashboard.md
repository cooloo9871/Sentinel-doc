---
id: dashboard
title: Dashboard 總覽
sidebar_position: 1
---

# Dashboard 總覽

## 功能說明

Dashboard 是登入 Sentinel 後的首頁，提供叢集安全策略的概覽統計。透過 Dashboard，您可以快速掌握目前叢集中 TracingPolicy 的數量、執行模式以及全域保護狀態，無需進入各個子頁面即可瞭解整體安全態勢。

---

## 統計卡片總覽

登入後，Dashboard 頂部會顯示四個統計卡片，提供叢集安全狀態的即時快照。

![Dashboard 統計卡片](/img/features/dashboard/overview.png)

各統計卡片說明如下：

| 卡片名稱 | 說明 |
|---|---|
| **Total Policies** | 叢集中已建立的 TracingPolicy 總數，包含 Cluster-scoped 與 Namespace-scoped 兩種類型 |
| **Protect Mode** | 目前設定為 Protect 模式的 Policy 數量；Protect 模式下 Tetragon 會主動阻擋違規行為 |
| **Namespaces** | Sentinel 目前管理中的 Kubernetes Namespace 數量 |
| **Global Protect Mode** | 全域保護模式的開關狀態（On / Off）；開啟後所有 Policy 同時切換為 Protect 模式 |

---

## 建立第一條 Policy

若叢集中尚未建立任何 TracingPolicy，Dashboard 會顯示引導按鈕，協助您快速完成初次設定。

![Create your first policy 按鈕](/img/features/dashboard/create-first-policy.png)

點擊「**Create your first policy**」按鈕後，頁面會跳轉至 TracingPolicy 建立頁面，您可以透過表單編輯器或 YAML 編輯器建立第一條安全策略。

---

## 資料更新原理

Dashboard 上的統計數據由後端定期向 Kubernetes API Server 發送查詢請求取得，並快取在伺服器端以降低 API 呼叫頻率。若需要取得最新數據，點擊頁面右上角的「**Refresh**」按鈕可手動觸發一次即時查詢，確保統計結果反映叢集的當前狀態。
