---
id: execution-mode
title: 執行模式切換
sidebar_position: 5
---

# 執行模式切換

## 兩種執行模式說明

K8s Sentinel 的每條 TracingPolicy 皆支援兩種執行模式，可依照部署階段與驗證進度彈性切換：

| 模式 | 說明 | 適用時機 |
|---|---|---|
| **Monitoring** | 僅記錄偵測到的事件，不阻擋任何行為。所有違規操作皆會產生安全事件紀錄，但 Pod 仍可正常執行 | 初期部署階段、觀察期、Policy 驗證階段 |
| **Protect** | 同時記錄事件並主動阻擋違規行為。違反 Policy 規則的 process 執行或檔案存取將被 Tetragon 直接攔截拒絕 | 策略驗證完成、確認規則無誤後正式上線 |

---

## 方法一：在列表直接切換（Inline Mode Switch）

**最快速**的切換方式：在 Tracing Policy 列表頁的 **Mode** 欄位，直接點擊下拉選單選擇 `Monitoring` 或 `Protect`。

![Tracing Policy 列表（Mode 欄位下拉）](/img/features/policy/list.png)

Tetragon Agent 會在數秒內套用新模式，無需進入編輯頁面或重啟任何服務。

---

## 方法二：在建立/編輯頁面設定

建立新 Policy 或點擊列表中的「**Edit**」進入編輯頁面時，頁面右上角的 **Mode** 下拉選單可設定該 Policy 的執行模式。

![建立 Policy 頁面（Mode 下拉）](/img/features/policy/create.png)

修改後點擊「**Apply**」套用，Tetragon Agent 立即生效。

---

## 一次全部切回 Monitoring

v0.81.3 起，**Global Protect Mode 已移除**：Protect 只能逐一為每個 Policy 開啟（方法一或方法二），不再有把所有 Policy 一次切換成 Protect 的開關。

相反的方向仍然可以一次完成。只要有任何 Policy 處於 Protect，Tracing Policy 列表右上角就會出現「**Set all to Monitoring**」按鈕，用來立刻停止所有 Policy 的阻擋：

![Set all to Monitoring 確認對話框](/img/features/mode/set-all-monitoring.png)

確認後，叢集內所有 TracingPolicy 與 TracingPolicyNamespaced 都會改為 Monitoring。違規行為仍會被記錄，只是不再被阻擋；要恢復阻擋，需要再逐一把 Policy 切回 Protect。這個操作會記錄在 [Audit Log](./audit-log.md)。

- 這個按鈕需要 Tracing Policy 的 Manage 權限（見 [角色與權限](./roles.md)），被限制在部分 Namespace 的帳號不會看到
- 頁首的標示與 Dashboard 的 **Policies in Protect** 卡片會顯示有幾個 Policy 處於 Protect，例如 `2 / 4 in Protect`

:::note[沒有條件的 Policy 不會進入 Protect]
selector 沒有任何條件的 Policy（例如「Monitor All Process Executions」範本，回報每一次呼叫）即使設為 Protect 也會維持 Monitoring，因為對每一次呼叫都執行終止，會停止所選 Pod 中的所有行程。
:::

:::warning
把 Policy 切換為 Protect 之前，請確認它的規則已充分驗證。若規則設定有誤（例如 Whitelist 遺漏了必要的執行檔路徑），切換後可能導致正常的服務被阻擋。建議先以 Monitoring 觀察一段時間，確認沒有誤判後再切換。
:::
