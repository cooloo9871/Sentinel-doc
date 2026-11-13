---
id: vulnerabilities
title: 工作負載弱點（Workloads）
sidebar_position: 11
---

# 工作負載弱點（Workloads）

## 功能說明

「**Vulnerabilities → Workloads**」頁面（v0.60 起）列出叢集內每一個**執行中的工作負載**，以及其 Image 中已知的弱點（CVE）。

**K8s Sentinel 不自行掃描這些 Image。** 掃描由 [Trivy Operator](https://github.com/aquasecurity/trivy-operator) 執行，K8s Sentinel 讀取它寫出的 `VulnerabilityReport` 資源。Trivy Operator 為選用元件，安裝方式見 [安裝 Trivy Operator](../installation/trivy-operator.md)。

此頁面只做**呈現與排序**，本身不會阻擋部署；要依掃描結果拒絕弱點過多的 Image，請見 [以掃描結果阻擋部署](./vulnerability-admission.md)。尚未部署、仍在 Registry 中的 Image，請見 [Registry 掃描](./registry-scanning.md)。

---

## 列表的排序與判讀

![Vulnerabilities Workloads 列表](/img/features/vulnerabilities/workloads.png)

列表上方的摘要列顯示工作負載總數、Critical 與 High 弱點總數，以及「critical and exposed」的工作負載數。工作負載有多個 Image 時，`Image` 欄顯示第一個並標示「+N more」。

列表欄位為 `Workload`、`Namespace`、`Image`、`Critical`、`High`、`Medium`、`Low`、`Unknown`、`Fixable`、`Scanned`。

| 行為 | 說明 |
|---|---|
| **依修補優先順序排列** | 同時具有 Critical 弱點且**可從叢集外部觸及**的工作負載排在最前面，其次依 Critical、High 數量排序。「可從外部觸及」使用與 [Network Topology](./network-topology.md) 相同的暴露偵測，因此這裡的 **Exposed** 徽章與拓撲圖上的暴露標示必定一致 |
| **一個工作負載一列** | Trivy Operator 把報告掛在作用中的 ReplicaSet 之下，K8s Sentinel 會彙整到 Deployment（實際會去修改的物件）。CronJob 執行中的 Pod 列在該 CronJob 之下 |
| **Not scanned 不等於乾淨** | 列表是由**執行中的 Pod** 建立的，沒有報告的工作負載顯示為 **Not scanned**、數量欄為「-」，絕不會顯示成 0。只有部分 Image 有報告時標示為 **partial** |
| **stale** | 掃描結果超過 7 天。Trivy Operator 依自己的排程重新掃描，舊報告無法反映之後才公布的 CVE |
| **Fixable** | 已列出修正版本的弱點數量，也就是升級 Image 即可消除的部分 |

:::note[為什麼舊 Image 會是未掃描]
Trivy Operator 掃描的是工作負載的 **Pod template**。若 template 已更新、但舊 Image 的 Pod 仍在執行，舊 Image 會維持未掃描。
:::

### 沒有自己報告的容器

v0.62 起，容器沒有自己的報告時，會採用**相同 Image** 的報告，因為掃描結果屬於 Image 本身，與它在哪裡執行無關。這涵蓋兩種情況：

- 同一個工作負載內多個容器共用同一個 Image（例如 Cilium agent），Operator 有時只完成其中一部分掃描
- 准入階段才注入的 Sidecar（例如 service mesh proxy），不在 Operator 掃描的 template 內，但該 Image 通常已在宣告它的地方被掃描過

Image 必須相同：相同的 repository 與 tag（或 digest）；若取自其他工作負載的報告，Registry 也必須相同。叢集內沒有其他地方宣告的 Sidecar Image 仍會維持 **partial**。

---

## 篩選、展開與匯出

| 元素 | 說明 |
|---|---|
| **Search workload or image...** | 以工作負載名稱或 Image 搜尋 |
| **Namespace 篩選** | 可同時選擇多個 Namespace |
| **Filter → Severity** | `Critical` / `High` / `Medium` / `Low` / `Unknown` |
| **Filter → Show only** | `Exposed`、`Fix available`、`Not fully scanned`，可複選疊加；例如 Exposed 加上 Fix available 就是一份待辦清單 |
| **Refresh** | 立即重新讀取叢集 |
| **Export CSV** | 匯出目前畫面上的內容，每個 Image 一行 |

**展開任一列**可看到各 Image 自己的數量與弱點明細，欄位為 `Severity`、`ID`（CVE 編號，連結至公告）、`Package`、`Installed`、`Fixed in`、`Summary`（工作負載有多個 Image 時另有 `Container` 欄）。明細依嚴重性由高到低排列，同一嚴重性內有修正版本的排前面；預設顯示 50 筆，點擊「Show all N findings」顯示全部。

若展開當下報告無法讀取（Trivy Operator 每次重新掃描都會改寫報告），該列會明確說明，而不是顯示成沒有弱點；按 **Refresh** 重試即可。

![展開工作負載的弱點明細](/img/features/vulnerabilities/workload-expanded.png)

---

## 資料更新時機

- 工作負載清單快取 1 分鐘，掃描報告摘要快取 5 分鐘（v0.61+）。因此剛完成的掃描最多可能要 5 分鐘才會出現；按 **Refresh** 可立即讀取
- 包含 init container；已結束的 Pod（完成的 Job）與 Trivy Operator 自己的掃描 Job 不列入

---

## 頁面沒有資料時

頁面會直接說明原因：

| 頁面訊息 | 原因與處理 |
|---|---|
| `Trivy Operator was not found in this cluster.` | 尚未安裝 Trivy Operator，見 [安裝 Trivy Operator](../installation/trivy-operator.md) |
| `Sentinel is not permitted to read vulnerability reports.` | ClusterRole 缺少讀取報告的規則。從較早版本升級時需重新套用 `deploy/sentinel.yaml` |
| `Vulnerability reports could not be read.` | 讀取報告時發生錯誤，訊息下方會顯示原因 |

---

## 同一份結果出現在其他頁面

v0.61 起，弱點掃描結果同時呈現在三個地方：

| 頁面 | 呈現方式 |
|---|---|
| [Network Topology](./network-topology.md) | Pod 自身的 Image 有 Critical 弱點時，節點左上角出現**紅色 bug 圖示**；詳情面板顯示數量，並在該 Pod 同時可從叢集外部觸及時特別註明 |
| [Dashboard](./dashboard.md) | **Vulnerabilities** 卡片：Critical 與 High 總數、同時為 Critical 且對外暴露的工作負載數、未完整掃描的工作負載數，以及最該優先修補的 5 個工作負載 |
| [Event Sources](./namespace-view.md) | 將 Trivy Operator 列為一個來源，顯示其狀態、報告數量與最新報告時間 |
