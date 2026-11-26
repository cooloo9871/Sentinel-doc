---
id: roles
title: 角色與權限
sidebar_position: 14
---

# 角色與權限

## 功能說明

帳號的權限由**角色（Role）**決定。一個角色對產品的八個部分分別授予 **None**、**View** 或 **Manage** 其中一級，因此可以建立「只能看事件」或「管理 Network Policy、但只能看事件」這類角色，而不是只有 Admin 與 Viewer 兩種選擇。

- **Admin** 與 **Viewer** 是內建角色，意義與之前相同，既有帳號不需要任何調整
- 其他角色在「**Settings → Roles**」建立
- 每個帳號有一個角色，可以在「**Settings → Users**」的 **Access** 對話框中更換

![Roles 列表](/img/features/roles/list.png)

---

## 權限範圍與等級

角色對下列每一個範圍各授予一個等級：

| 範圍 | 包含的頁面 |
|---|---|
| **Tracing Policy** | Tracing Policy、Templates、Behavior Discovery |
| **Network Policy** | Network Policy、Network Topology |
| **Admission Policy** | Admission Policy、Bindings |
| **Quarantine** | Pod 的隔離與解除 |
| **Events** | Security Events、Admission Events、Event Sources |
| **Vulnerabilities** | Workloads、Registries |
| **Notifications** | Alerts、Syslog |
| **System** | Users、Roles、Audit Log、Event Retention、Session Timeout |

| 等級 | 說明 |
|---|---|
| **None** | 看不到該範圍的頁面，API 也會拒絕 |
| **View** | 可以讀取 |
| **Manage** | 可以新增、修改與刪除。Manage 包含 View |

角色沒有授予的頁面不只是被隱藏：側邊欄不會列出，直接開啟網址會被導回 Dashboard，API 也會拒絕讀取（回應 `this account's role does not allow this`）。Dashboard 上的卡片同樣只顯示角色看得到的部分。

---

## 內建角色

| 角色 | 權限 |
|---|---|
| **Admin** | 所有範圍皆為 Manage |
| **Viewer** | 除了 Notifications 與 System 之外，所有範圍皆為 View |

內建角色不能修改或刪除，在列表中以 **Built-in** 標示，只能點擊「**View**」查看內容。

:::note[Viewer 不能讀取通知與設定]
Viewer 看不到 Alerts、Syslog 與 Settings 的頁面，API 也不能直接讀取這些資料（`GET /api/alerts`、`GET /api/rsyslog`、`GET /api/settings/session-ttl`），因為通知目標的 URL 本身就是憑證。
:::

---

## 建立角色

在「**Settings → Roles**」點擊「**+ New Role**」，填入名稱，並為每一個範圍選擇等級後按「**Create**」。

![New Role 表單](/img/features/roles/new-role.png)

| 項目 | 說明 |
|---|---|
| **Name** | 1 到 40 個字元，可使用英文字母、數字、空格、`-` 與 `_`。名稱不分大小寫，不能與既有角色重複（包含 `admin` 與 `viewer`）。**建立後不能修改**，因為帳號以名稱參照角色 |
| **各範圍的等級** | 預設全部為 None |

:::warning[System 設為 Manage 等同於擁有全部權限]
管理 System 包含「把任何帳號改成任何角色」，擁有這個角色的帳號也包含在內。表單在 System 選擇 Manage 時會顯示這段提醒。
:::

---

## 修改與刪除角色

- 在列表中點擊「**Edit**」可以修改角色授予的權限。變更會**立即生效**，包含已經開啟的 Session，不需要重新登入
- 仍有帳號使用的角色**不能刪除**，會顯示 `1 account has this role. Give them another role first.`。請先把這些帳號改成其他角色。列表的 **Accounts** 欄位顯示每個角色目前有幾個帳號
- 角色若已不存在，仍參照它的帳號不會有任何權限

---

## 指派角色給帳號

- **建立帳號時**：在 New User 表單的 **Role** 下拉選單選擇
- **既有帳號**：在使用者列表點擊該帳號的「**Access**」，於 **Role** 選擇新的角色後按「**Save**」，立即生效

詳見 [使用者管理](./users.md)。

:::caution[一定會保留一個完整的 Admin]
叢集中最後一個「角色為 Admin 且存取整個叢集」的帳號，不能被刪除、不能改成其他角色，也不能被限制在部分 Namespace。
:::

---

## 與 Namespace 限制的關係

[依 Namespace 限制帳號存取](./namespace-access.md) 的設定**疊加在角色之上**：受限的帳號在自己的 Namespace 中，可以建立與編輯角色所管理的內容，讀取角色可以查看的內容。

Notifications 與 System 屬於整個叢集，受限的帳號不論角色為何都無法存取。

---

## 儲存位置

- 自訂的角色存放在資料目錄的 `roles.json`。與其他設定一樣，需要 [持久化儲存](../installation/persistent-storage.md) 才能在 Pod 重啟後保留
- 建立、修改、刪除角色，以及變更帳號的角色，都需要 System 的 Manage 權限
