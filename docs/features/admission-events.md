---
id: admission-events
title: Admission Events
sidebar_position: 12
---

# Admission Events

## 功能說明

Admission Events 頁面記錄並呈現 Kubernetes **ValidatingAdmissionPolicy** 的違規事件。當叢集中的資源操作（建立或更新）違反已套用的 Admission Policy 規則時，API Server 會產生 Warning 事件，Sentinel 透過 Webhook 端點接收並儲存這些事件，供使用者即時查閱與審查。

---

## 查看 Admission Events

進入「**Admission Events**」頁面後，所有已捕捉的 Admission 違規事件會以清單形式列出。

![Admission Events 頁面](/img/features/admission-events/list.png)

**頁面元素說明：**

| 元素 | 說明 |
|---|---|
| **事件統計** | 頁面頂部顯示總事件數、Warning 數量與 Critical 數量的統計摘要 |
| **搜尋框** | 輸入資源名稱或 Policy 名稱關鍵字，快速篩選事件 |
| **Namespace 選單** | 篩選特定 Namespace 的違規事件 |
| **事件類型選單** | 切換顯示所有事件或特定類型 |
| **來源選單** | 切換顯示來自 Audit Log 的事件 |

---

## 事件嚴重性

| 等級 | 說明 |
|---|---|
| **Warning** | 資源違反 Admission Policy 規則，但因 `failurePolicy: Warn` 設定仍被允許通過 |
| **Critical** | 資源因違反 Admission Policy 而被 API Server 拒絕（`failurePolicy: Fail`） |

---

## 設定 Kubernetes Audit Log

Admission Events 的資料來源為 Kubernetes Audit Webhook。以下步驟說明如何在 kubeadm 部署的叢集上設定 Audit Policy 與 Webhook，讓 API Server 將 Admission Policy 違規事件轉送至 Sentinel。

:::note
以下步驟需在**每台 control plane 節點**上執行。
:::

### 步驟一：建立 Audit Policy 檔案

```bash
sudo nano /etc/kubernetes/audit-policy.yaml
```

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # 只捕捉被拒絕的 admission 請求（VAP 違規）
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
    omitStages: ["RequestReceived"]
```

### 步驟二：建立 Audit Webhook 設定檔

```bash
sudo nano /etc/kubernetes/audit-webhook.yaml
```

```yaml
apiVersion: v1
kind: Config
clusters:
  - name: sentinel
    cluster:
      # 替換為你的 Sentinel service ClusterIP
      server: http://10.96.83.239/api/admission-events/webhook
users:
  - name: sentinel
contexts:
  - name: default
    context:
      cluster: sentinel
      user: sentinel
current-context: default
```

:::tip
`server` 欄位中的 IP 請替換為你叢集中 Sentinel Service 的 ClusterIP。可透過以下指令查詢：
```bash
kubectl get svc -n <sentinel-namespace>
```
:::

### 步驟三：修改 kube-apiserver 設定

編輯 kubeadm configmap，加入 Audit 相關的 extraArgs 與 extraVolumes：

```bash
kubectl edit cm -n kube-system kubeadm-config
```

在 `ClusterConfiguration.apiServer` 區段中加入以下內容：

```yaml
data:
  ClusterConfiguration: |
    apiServer:
      extraArgs:
      - name: audit-policy-file
        value: "/etc/kubernetes/audit-policy.yaml"
      - name: audit-log-path
        value: "/var/log/kubernetes/audit-logs.txt"
      - name: audit-log-maxage
        value: "10"
      - name: audit-log-maxbackup
        value: "2"
      - name: audit-log-maxsize
        value: "100"
      - name: audit-webhook-config-file
        value: "/etc/kubernetes/audit-webhook.yaml"
      - name: audit-webhook-batch-max-wait
        value: "5s"
      extraVolumes:
      - name: audit-policy
        hostPath: /etc/kubernetes/
        mountPath: /etc/kubernetes/
        readOnly: true
      - name: audit-log
        hostPath: /var/log/kubernetes/
        mountPath: /var/log/kubernetes/
```

### 步驟四：套用設定至 kube-apiserver static pod

將 configmap 匯出為檔案：

```bash
kubectl get cm -n kube-system kubeadm-config \
  -o jsonpath={.data.ClusterConfiguration} > config.yaml
```

將 `config.yaml` 複製到每一台 control plane 後，套用設定：

```bash
sudo kubeadm init phase control-plane apiserver --config ./config.yaml
```

### 步驟五：重啟 kubelet 並確認 kube-apiserver 已更新

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

確認 kube-apiserver container 已重新建立：

```bash
sudo crictl ps --name kube-apiserver
```

輸出範例：

```
CONTAINER           IMAGE               CREATED             STATE     NAME             ATTEMPT
eff3881e1f2fc       c3994bc6961024...   3 seconds ago       Running   kube-apiserver   0
```

`CREATED` 欄位顯示數秒前代表重啟成功。

---

:::info
Admission Events 的事件保留設定可在「**Settings → Event Retention**」頁面的「Admission Events」標籤頁中進行調整，包含最大事件數量與 TTL（保留天數）。
:::
