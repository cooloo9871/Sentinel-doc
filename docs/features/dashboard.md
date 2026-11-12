---
id: dashboard
title: Dashboard 總覽
sidebar_position: 1
---

# Dashboard 總覽

## 功能說明

Dashboard 是登入 K8s Sentinel 後的首頁，以「**Overview**」頁面呈現叢集安全狀態的即時快照。您可以快速掌握 Tetragon Agent 健康狀況、安全事件數量與 Admission 違規情況，以及全域保護模式的開關狀態，並預覽最新的 Tracing Policy、Admission Policy、Network Policy、Quarantine 隔離狀態與弱點掃描摘要。

---

## 統計卡片總覽

登入後，Dashboard 頂部會顯示四個統計卡片：

![Dashboard 統計卡片](/img/features/dashboard/overview.png)

| 卡片名稱 | 說明 |
|---|---|
| **Tetragon Agents** | 顯示叢集中 Tetragon Agent 的健康比例（例如 `2 / 2`）與整體狀態；v0.49 起反映的是**事件串流狀態**而非單純的 Pod readiness，任一串流中斷時 Dashboard 會出現紅色警示 banner |
| **Security Events** | Tetragon 偵測到的 kprobe 安全事件總數，細分 `Critical: N / Warning: N` |
| **Admission Events** | ValidatingAdmissionPolicy 違規事件總數，細分 `Critical: N / Warning: N` |
| **Global Protect Mode** | 全域保護模式的開關狀態；`OFF` 時顯示「Monitoring only」，`ON` 時顯示「Enforcing」 |

---

## Vulnerabilities 卡片

![Dashboard 的 Vulnerabilities 卡片](/img/features/dashboard/vulnerabilities-card.png)

v0.61 起，Dashboard 會顯示 **Vulnerabilities** 卡片，資料來自 Trivy Operator 的掃描報告（見 [工作負載弱點](./vulnerabilities.md)）：

- **Critical 與 High 弱點總數**
- 同時具有 Critical 弱點且**對外暴露**的工作負載數（大於 0 時以紅色顯示）
- **未完整掃描**的工作負載數
- 最該優先修補的 **5 個工作負載**，欄位為 `Workload`、`Namespace`、`Critical`、`High`、`Fixable`，對外暴露者帶 `Exposed` 徽章

此卡片**一律顯示**：沒有掃描器時會寫明「Scanning is not enabled」，不會呈現一張可能被誤認為「叢集很乾淨」的空表格。點擊卡片右上角的按鈕可跳轉至 Vulnerabilities 頁面。

---

## Tracing Policy 預覽

Dashboard 中段會顯示最新建立的 Tracing Policy（最多 4 筆），包含 Name、Scope、Mode、Namespace 與建立時間。點擊右上角「**View all →**」可跳轉至完整的 Tracing Policy 列表頁。

若叢集中尚未建立任何 TracingPolicy，該區塊會顯示「**Create your first policy**」引導按鈕。

![Create your first policy 按鈕](/img/features/dashboard/create-first-policy.png)

---

## Admission Policy 預覽

Dashboard 下段會顯示 Admission Policy 的摘要（Policy 數與 Binding 數）。若尚未建立，會顯示「No admission policies」提示。點擊「**View all →**」可跳轉至 Admission Policy 頁面。

---

## Network Policy 預覽

顯示叢集內 Cilium Network Policy 的數量摘要。若尚未建立，會顯示「No network policies」提示。點擊「**View all →**」可跳轉至 [Network Policy](./network-policy.md) 頁面。

---

## Quarantine 隔離狀態

顯示目前被隔離的 Pod 概況。若沒有任何 Pod 被隔離，會顯示「Nothing is quarantined」。點擊「**View all →**」可跳轉至 [Quarantine](./quarantine.md) 頁面。

---

## 資料更新

Dashboard 統計數據由後端定期向 Kubernetes API Server 查詢後快取。點擊頁面右上角的「**Refresh**」按鈕可手動觸發即時查詢，確保數據反映叢集當前狀態。
