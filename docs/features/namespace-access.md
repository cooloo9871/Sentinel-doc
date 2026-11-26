---
id: namespace-access
title: 依 Namespace 限制帳號存取
sidebar_position: 14
---

# 依 Namespace 限制帳號存取

## 功能說明

帳號可以被限制在指定的 Namespace 內：只看得到、也只能管理這些 Namespace 中的內容。可以在建立帳號時設定，也可以之後調整。

角色在這些 Namespace 內仍然有效：**受限的 Admin** 可以在其中建立與編輯，**受限的 Viewer** 只能讀取。自訂角色也一樣：受限的帳號可以在自己的 Namespace 中建立與編輯角色所管理的內容，讀取角色可以查看的內容，見 [角色與權限](./roles.md)。本頁提到的「受限的 Admin」，在自訂角色下是指對該範圍有 Manage 權限的受限帳號。

:::info[這是團隊內的分工，不是租戶隔離]
限制由伺服器在**每一個請求與事件串流**上執行，而不是只把頁面藏起來。但 Network Topology 會顯示所有 Namespace 與工作負載的名稱，因此這個功能適合用來劃分團隊內的工作範圍，不適合用來隔離互不信任的租戶。
:::

---

## 設定存取範圍

### 建立帳號時

在「**Settings → Users**」點擊「**+ New User**」，於 **Access** 選擇「**Selected namespaces**」並勾選 Namespace。選擇此項時至少要勾選一個 Namespace，否則無法建立。

![新增使用者表單的 Access 設定](/img/features/users/new-user.png)

### 調整既有帳號

在使用者列表中點擊該帳號的「**Access**」，選擇「**Whole cluster**」或「**Selected namespaces**」後按「**Save**」。

![Access 對話框](/img/features/users/access-dialog.png)

- 變更會**立即生效**，包含該帳號已經開啟的 Session，不需要重新登入
- 受限帳號的 Namespace 會以標籤顯示在使用者列表中該帳號的名稱旁
- **帳號不能限制自己**，因此一定會留下一個能管理其他帳號的帳號

---

## 受限帳號看得到什麼

| 頁面 | 受限帳號 |
|---|---|
| **Tracing Policy**、**Network Policy** | 只有自己 Namespace 中的 Policy。叢集層級的 Policy 不會列出，也無法寫入 |
| **Behavior Discovery**、**Security Events**、**Admission Events**、**Vulnerabilities（Workloads）**、**Quarantine** | 只有自己 Namespace 中的內容 |
| **Network Topology** | 完整顯示，因為一條連線有兩端，另一端通常不在自己的 Namespace。從拓撲圖執行隔離時，只能隔離自己 Namespace 中的 Pod |
| **Templates** | 可以讀取，並用來建立 Policy。新增、編輯與刪除範本僅限整個叢集的 Admin，因為範本由所有人共用 |
| **Admission Policy** | 受限的 Admin 可以為自己的 Namespace 建立 Policy 與 Binding，見下一節 |
| **Registries**、**Event Sources**、**Audit Log**、所有 **Settings**、Tracing Policy 列表的「Set all to Monitoring」按鈕 | 隱藏，API 也會拒絕。Notifications（Alerts、Syslog）與 System 屬於整個叢集，受限帳號不論角色為何都無法存取 |

補充說明：

- 叢集層級的 Policy 在受限帳號的 Pod 上觸發的事件**會顯示**，並附上該 Policy 的名稱
- 受限帳號的側邊欄只會出現 Dashboard、Network Topology、Vulnerabilities → Workloads、Policies 與 Notifications（Security Events、Admission Events）。其中角色沒有 View 權限的項目同樣不會出現
- 受限帳號直接開啟被隱藏頁面的網址時，會被導回 Dashboard
- Tracing Policy 與 Network Policy 列表的 Namespace 篩選器不對受限帳號提供 `Cluster-wide` 選項

---

## 受限 Admin 的 Admission Policy

Kubernetes 沒有 Namespace 層級的 Admission Policy，因此 K8s Sentinel 會在受限 Admin 建立的每一個 Policy 上標記它所屬的 Namespace（annotation `sentinel.io/namespaces`），並把它限制在這些 Namespace 內：

| 限制 | 說明 |
|---|---|
| **Binding 必須是「Only these namespaces」** | 而且只能選自己的 Namespace。「All namespaces」、「All except」以及用其他 Label 選取都會被拒絕。Binding 表單對受限帳號只會提供這個模式 |
| **Policy 只會比對 Namespace 層級的資源** | 每一條規則都會加上 `scope: Namespaced`，因為 Binding 的 Namespace 選取條件無法阻止 Policy 套用到 Node、ClusterRole 等叢集層級資源 |
| **只能綁定自己的 Policy** | 不能綁定叢集的 Policy，也不能修改或刪除整個叢集的 Admin 為其 Namespace 建立的 Binding |
| **不接受參數** | 唯一的例外是 [弱點規則](./vulnerability-admission.md) 讀取的掃描結果。否則 Policy 可以被寫成在拒絕訊息中讀出任意物件 |
| **名稱不能與既有 Binding 參照的名稱相同** | 名稱已被看不到的 Policy 或 Binding 使用時，訊息會直接說明該名稱已存在，請換一個名稱 |

誰看得到這些 Policy：

- 受限帳號只會列出**標記的 Namespace 全部都屬於自己**的 Policy；擁有相同 Namespace 的帳號會共用它們
- 新的 Policy 會標記建立者擁有的**所有** Namespace，因此只擁有其中一部分的帳號看不到它
- 整個叢集的 Admin 看得到全部，名稱旁會顯示所屬的 Namespace；由他編輯這類 Policy 時，標記與限制都會保留

:::note[把 Policy 交還給整個叢集]
要讓這類 Policy 變成一般的叢集 Policy，需要移除標記：

```bash
kubectl annotate validatingadmissionpolicy <name> sentinel.io/namespaces-
```
:::

:::caution[整個叢集的 Admin 建立的 Binding 不受此保護]
整個叢集的 Admin 把 Binding 限制在某些 Namespace 時，若 Policy 會比對叢集層級資源（Apply To 為 All），它仍然會在所有地方套用到這些叢集層級資源。
:::

---

## 帳號與密碼

- 受限的 Admin **不能管理帳號**，也不能重設其他帳號的密碼。重設其他帳號的密碼需要整個叢集的 Admin
- 受限帳號與 Viewer 一樣，在 UI 中沒有變更自己密碼的地方，需由整個叢集的 Admin 重設

---

## 已知限制

- 受限帳號看不到 Dashboard 上的事件來源警告
