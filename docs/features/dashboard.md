---
id: dashboard
title: Dashboard 總覽
sidebar_position: 1
---

# Dashboard 總覽

## 功能說明

Dashboard 是登入 Sentinel 後的首頁，以「**Overview**」頁面呈現叢集安全狀態的即時快照。您可以快速掌握 Tetragon Agent 健康狀況、安全事件數量與 Admission 違規情況，以及全域保護模式的開關狀態，並預覽最新的 Tracing Policy 與 Admission Policy 設定。

---

## 統計卡片總覽

登入後，Dashboard 頂部會顯示四個統計卡片：

![Dashboard 統計卡片](/img/features/dashboard/overview.png)

| 卡片名稱 | 說明 |
|---|---|
| **Tetragon Agents** | 顯示叢集中 Tetragon Agent 的健康比例（例如 `3 / 3`）及整體狀態（All nodes online / 部分 Unhealthy） |
| **Security Events** | Tetragon 偵測到的 kprobe 安全事件總數，細分 `Critical: N / Warning: N` |
| **Admission Events** | ValidatingAdmissionPolicy 違規事件總數，細分 `Critical: N / Warning: N` |
| **Global Protect Mode** | 全域保護模式的開關狀態；`OFF` 時顯示「Monitoring only」，`ON` 時顯示「Enforcing」 |

---

## Tracing Policy 預覽

Dashboard 中段會顯示最新建立的 Tracing Policy（最多 4 筆），包含 Name、Scope、Mode、Namespace 與建立時間。點擊右上角「**View all →**」可跳轉至完整的 Tracing Policy 列表頁。

若叢集中尚未建立任何 TracingPolicy，該區塊會顯示「**Create your first policy**」引導按鈕。

![Create your first policy 按鈕](/img/features/dashboard/create-first-policy.png)

---

## Admission Policy 預覽

Dashboard 下段會顯示 Admission Policy 的摘要（Policy 數與 Binding 數）。若尚未建立，會顯示「No admission policies」提示。點擊「**View all →**」可跳轉至 Admission Policy 頁面。

---

## 資料更新

Dashboard 統計數據由後端定期向 Kubernetes API Server 查詢後快取。點擊頁面右上角的「**Refresh**」按鈕可手動觸發即時查詢，確保數據反映叢集當前狀態。
