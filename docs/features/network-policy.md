---
id: network-policy
title: Network Policy
sidebar_position: 17
---

# Network Policy

## 功能說明

Network Policy 頁面提供 **Cilium Network Policy** 的視覺化管理功能。透過圖形化表單即可定義 Pod 之間的 Ingress（入站）與 Egress（出站）網路存取規則，無需手寫 YAML；Sentinel 會依表單內容自動產生對應的 `CiliumNetworkPolicy` 資源並套用至叢集。

自此版本起，Pod 的網路存取控制由 Cilium Network Policy 負責（原 TracingPolicy 表單中的 Network Rules 區段已移除）：TracingPolicy 專注於行程與檔案層級的安全控管，網路層級的允許/封鎖規則統一在本頁面管理。

---

## 查看 Policy 清單

進入「**Policies → Network Policy**」頁面後，所有已建立的 Network Policy 會以表格形式列出。

![Network Policy 列表頁](/img/features/network-policy/list.png)

**表格欄位說明：**

| 欄位 | 說明 |
|---|---|
| **Name** | CiliumNetworkPolicy 的資源名稱 |
| **Scope** | Namespaced Policy 顯示所屬 Namespace；Cluster-wide Policy 顯示 cluster |
| **Applies to** | 此 Policy 管轄的 Pod Label 選擇條件（例如 `app=backend`） |
| **Rules** | 規則數量摘要：`in N` 表示 N 條 Ingress 規則、`out N` 表示 N 條 Egress 規則 |
| **Default Deny** | 顯示此 Policy 造成預設封鎖的方向（`Ingress` / `Egress`）；Whitelist 模式下未列入規則的流量一律被拒絕 |
| **Created By** | 建立此 Policy 的使用者帳號 |
| **Created Time** | Policy 建立的完整時間戳記 |
| **Actions** | `Edit`（進入編輯頁面）與 `Delete`（刪除，附確認對話框）按鈕 |

頁面頂部提供「**Search by name...**」搜尋框與「**All namespaces**」Namespace 篩選器。

---

## 建立新 Policy（表單）

點擊「**+ New Policy**」按鈕進入圖形化建立頁面，左側為表單、右側為 **Generated YAML** 即時預覽。

![建立 Network Policy 表單](/img/features/network-policy/new-form.png)

### 基本欄位

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Name** | ✅ | Policy 資源名稱，需符合 Kubernetes 命名規範 |
| **Scope** | ✅ | `Namespaced`（選擇器僅比對該 Namespace 內的 Pod，產生 `CiliumNetworkPolicy`）或 `Cluster-wide`（產生 `CiliumClusterwideNetworkPolicy`） |
| **Namespace** | Namespaced 時必填 | Policy 所屬 Namespace |
| **Comment** | — | 註解說明，方便團隊了解此 Policy 的用途 |
| **Applies to** | ✅ | 以 key=value Label 指定此 Policy 管轄的目標 Pod（`endpointSelector`），至少需一組 Label |

:::tip Selector 即時預覽（v0.40+）
編輯 **Applies to** 時，表單會即時顯示目前選擇器**實際匹配到哪些 Pod**（例如 `Selects 3 pods in demo: web-1, web-2, db-1`）。選不到任何 Pod 時以**紅色**警示（通常是 Label 打錯字）、空選擇器將管轄全部 Pod 時以**橘色**警示——在 Apply 之前就能發現「選錯對象」這類最危險的 Policy 錯誤。
:::

### Ingress / Egress 規則

Ingress 與 Egress 區段各自獨立設定，結構相同。**未新增任何規則的方向不會納入 Policy**（該方向流量不受此 Policy 影響）。

**Mode（每個方向各自設定）：**

| Mode | 說明 |
|---|---|
| **Whitelist** | 白名單：僅允許規則中列出的流量，其餘一律拒絕（形成該方向的 Default Deny） |
| **Blacklist** | 黑名單：僅封鎖規則中列出的流量，其餘一律允許 |

**每條 Rule 的設定項目：**

| 欄位 | 說明 |
|---|---|
| **From / To — kind** | 對象類型：`Labels`（以 Pod Label 選擇對象）、`Entity`（Cilium 保留身分）、`IP / CIDR`（v0.40+）或 `FQDN`（v0.40+，僅限 Egress 的 Whitelist） |
| **From / To** | Labels：輸入一組以上的 key=value Label；Entity：從下拉選擇 `world`、`cluster`、`host`、`remote-node`、`all`、`init`、`health`、`unmanaged`；IP / CIDR：輸入 IP 或網段（單一 IP 會寫成 /32 單主機 CIDR）；FQDN：輸入網域名稱，支援萬用字元（`github.com`、`*.github.com`） |
| **Peer namespace** | （Labels 時選填）限定對象 Pod 所屬的 Namespace |
| **Ports** | 選填；點擊「**+ Add Port**」新增 Port 與協定（TCP / UDP），留空表示不限制 Port |
| **L7 — HTTP rules** | 選填；點擊「**+ Add HTTP rule**」設定 HTTP Method 與 Path 的 L7 過濾規則。設定 HTTP rule 時必須同時指定至少一個 Port |

:::note FQDN 對象的限制與 DNS 規則
- **FQDN 只存在於 Egress 的 allow（Whitelist）方向**：Cilium 是從 Pod 收到的 DNS 回應學習網域對應的 IP，Ingress 與 Deny 方向沒有可比對的資訊，表單會直接說明而不是產生一條永遠不會生效的規則。
- 選用 FQDN 時，比對所依賴的 **DNS visibility 規則會自動附帶**——否則 Whitelist 的 Egress 會先把 DNS 本身擋掉，網域永遠解析不了。這條規則在表單讀取時自動摺疊、儲存時自動補回；手寫的變體則會以 YAML 模式開啟而不被改寫。
:::

表單下方會即時列出未完成的必填項目清單，全部通過驗證後「**Apply**」按鈕才會啟用。點擊 Apply 即建立 Policy 並套用至叢集。

**執行原理：** Sentinel 依表單內容產生 `CiliumNetworkPolicy`（或 `CiliumClusterwideNetworkPolicy`）YAML，透過 Kubernetes API Server 建立資源，由叢集內的 Cilium CNI 於資料平面即時強制執行。L7 HTTP 規則由 Cilium 的 Envoy 代理處理。

---

## 以 YAML 建立 Policy

點擊「**+ New YAML**」可切換至全螢幕 YAML 編輯器，直接撰寫或貼上完整的 Cilium Network Policy 資源定義。

Policy 的作用範圍由 manifest 的 `kind` 決定：`CiliumNetworkPolicy` 為 Namespace 層級，`CiliumClusterwideNetworkPolicy` 為叢集層級。完成後點擊「**Apply**」套用。

---

:::info
Network Policy 需要叢集使用 **Cilium** 作為 CNI。若叢集透過 Sentinel 的安裝腳本部署，Cilium 已內建於安裝流程中。
:::

:::tip
建議先到「**Network Topology**」頁面觀察 Pod 之間的實際連線關係（來源、目標與 Port），再依據觀察結果制定 Whitelist 規則，可有效避免遺漏必要連線導致服務中斷。
:::
