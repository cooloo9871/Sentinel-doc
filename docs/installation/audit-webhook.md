---
id: audit-webhook
title: 串接 API Server Audit Log
sidebar_position: 6
---

# 串接 API Server Audit Log

Sentinel 的「**Admission Events**」功能透過 **Kubernetes Audit Webhook** 接收 API Server 的稽核事件，藉此記錄 ValidatingAdmissionPolicy 的違規情況。本頁說明如何在 kubeadm 部署的叢集上設定 Audit Policy 與 Webhook，讓 API Server 將事件即時轉送至 Sentinel。

:::note
以下步驟需在**每台 control plane 節點**上執行。請先完成 Sentinel 的安裝，因為設定中需要填入 Sentinel Service 的 ClusterIP。
:::

---

## 步驟一：建立 Audit Policy 檔案

```bash
sudo nano /etc/kubernetes/audit-policy.yaml
```

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # 只捕捉資源異動（create/update/patch/delete）的 Metadata 層級事件
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
    omitStages: ["RequestReceived"]
```

此 Policy 僅記錄資源異動請求的 Metadata（不含完整 request/response body），並略過 `RequestReceived` 階段，將稽核資料量控制在最小範圍。

## 步驟二：建立 Audit Webhook 設定檔

先查詢 Sentinel Service 的 ClusterIP：

```bash
kubectl get svc -n sentinel-system sentinel
```

建立 Webhook 設定檔，`server` 填入上面查到的 ClusterIP：

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
      server: http://<sentinel-clusterip>/api/admission-events/webhook
users:
  - name: sentinel
contexts:
  - name: default
    context:
      cluster: sentinel
      user: sentinel
current-context: default
```

:::caution
`/api/admission-events/webhook` 端點為刻意設計的**免驗證端點**，僅接受 audit 事件格式的請求。請勿將其他請求導向此端點，也不要將此端點暴露至叢集外部。
:::

## 步驟三：修改 kube-apiserver 設定

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

**關鍵參數說明：**

| 參數 | 說明 |
|---|---|
| `audit-policy-file` | 步驟一建立的 Audit Policy，決定哪些請求會被記錄 |
| `audit-webhook-config-file` | 步驟二建立的 Webhook 設定，指向 Sentinel 的接收端點 |
| `audit-webhook-batch-max-wait` | 事件批次送出的最大等待時間；`5s` 可確保事件在數秒內抵達 Sentinel |
| `audit-log-path` 等 | 同時在本機保留一份稽核日誌檔（選用，方便除錯與合規存查） |

## 步驟四：套用設定至 kube-apiserver static pod

將 configmap 匯出為檔案：

```bash
kubectl get cm -n kube-system kubeadm-config \
  -o jsonpath={.data.ClusterConfiguration} > config.yaml
```

將 `config.yaml` 複製到每一台 control plane 後，套用設定：

```bash
sudo kubeadm init phase control-plane apiserver --config ./config.yaml
```

## 步驟五：重啟 kubelet 並確認 kube-apiserver 已更新

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

## 步驟六：驗證串接

觸發一次 Admission Policy 違規（例如建立一個違反已綁定 Policy 的資源），數秒內事件應出現在 Sentinel 的「**Notifications → Admission Events**」頁面。可利用頁面上的 **Source** 過濾器確認事件來源為 Audit Log，代表 Webhook 管線已正常運作。

:::info
若事件未出現，依序檢查：(1) `audit-webhook.yaml` 中的 ClusterIP 是否正確、(2) control plane 節點能否連通該 ClusterIP（`curl -s -o /dev/null -w "%{http_code}" http://<clusterip>/api/admission-events/webhook` 應回應非連線錯誤）、(3) kube-apiserver log 中是否有 audit webhook 相關錯誤。
:::
