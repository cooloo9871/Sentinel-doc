---
id: quarantine
title: Pod 隔離（Quarantine）
sidebar_position: 18
---

# Pod 隔離（Quarantine）

## 功能說明

Quarantine 提供事件應變（Incident Response）時的一鍵 Pod 網路隔離能力。當 Security Events 中發現某個 Pod 出現可疑行為時，可立即將該 Pod 從網路中隔離：**Pod 會被切斷所有網路連線，但行程持續運行**，其記憶體狀態、開啟的檔案與行程資訊全部保留，方便後續進行數位鑑識與調查。

---

## 隔離機制

![Quarantine 頁面](/img/features/quarantine/page.png)

Quarantine 的運作方式如下：

- **除 kubelet 健康檢查外，所有進出流量一律封鎖**。保留健康檢查是刻意的設計：若健康檢查也被擋下，kubelet 會重啟 Pod 並以全新（未被隔離）的副本取代，反而讓證據消失、威脅重新取得網路。
- **隔離狀態記錄在 Pod 的 `sentinel.io/quarantine=true` Label 上**，因此即使 K8s Sentinel 重啟，隔離狀態依然存在。
- 隔離由一條叢集層級的 Cilium Policy **`sentinel-quarantine`** 實現，它以上述 Label 選取目標 Pod。此 Policy 會在第一次執行隔離時自動建立。
- **若 Pod 被刪除重建，新 Pod 不會帶有隔離 Label**，也就不再受隔離限制。若威脅可能隨工作負載重建復發，請搭配其他 Policy 進行防護。

---

## 隔離一個 Pod

隔離操作的入口在「**Notifications → Security Events**」頁面。

1. 找到可疑行為對應的安全事件，點擊該列展開詳細資訊面板
2. 點擊面板右下角的「**Quarantine this pod**」按鈕

![Security Events 事件詳情中的 Quarantine 按鈕](/img/features/quarantine/event-quarantine.png)

3. 確認對話框會再次說明隔離的影響：該 Pod 將失去所有網路存取；容器持續運行，因此它對外提供的服務將中斷

![Quarantine 確認對話框](/img/features/quarantine/confirm-dialog.png)

4. 點擊「**Quarantine**」確認執行，該 Pod 立即被網路隔離

---

## 查看與解除隔離

進入「**Policies → Quarantine**」頁面可查看目前所有被隔離的 Pod，包含**由誰、在何時**執行隔離。尚未隔離任何 Pod 時，頁面會顯示「Nothing is quarantined」。

完成調查後，在此頁面對該 Pod 執行 **Release** 即可解除隔離（移除 `sentinel.io/quarantine` Label），Pod 隨即恢復正常網路連線。因為隔離狀態就存在 Pod 的 Label 上，不經 UI 也可以直接解除：

```bash
kubectl label pod <pod-name> -n <namespace> sentinel.io/quarantine-
```

:::note 只支援手動隔離
「違規即自動隔離」是**刻意不提供**的功能：TracingPolicy 表單預設為 Whitelist 模式，任何**未列入**清單的行為都會觸發事件，一條範圍設錯的 Policy 可能在數秒內把整個 Deployment 全部隔離。
:::

---

:::warning
隔離會中斷該 Pod 對外提供的所有服務。若目標 Pod 屬於 Deployment 等具備多副本的工作負載，其餘副本仍會繼續服務；隔離單一副本通常不會造成全面中斷，但仍建議先確認影響範圍再執行。
:::

:::tip
Quarantine 適合作為「**先止血、再調查**」的第一步：隔離後 Pod 的行程與記憶體狀態完整保留，可安全地使用 `kubectl exec`、`kubectl debug` 等工具進入容器蒐證，不必擔心威脅持續橫向移動。
:::
