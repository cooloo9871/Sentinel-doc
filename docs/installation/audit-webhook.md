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
`/api/admission-events/webhook` 端點在**未設定 Token 時為開放端點**（因為呼叫者是 kube-apiserver，沒有登入 Session 可用）。叢集內若有不完全信任的工作負載，請依下方「[保護 Webhook 端點](#保護-webhook-端點建議)」設定 Token 驗證，避免偽造事件灌入。
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
若事件未出現，依序檢查：(1) `audit-webhook.yaml` 中的 ClusterIP 是否正確、(2) control plane 節點能否連通該 ClusterIP（`curl -s -o /dev/null -w "%{http_code}" http://<clusterip>/api/admission-events/webhook` 應回應非連線錯誤）、(3) kube-apiserver log 中是否有 audit webhook 相關錯誤、(4) 若有設定 Token，見下方「[Token 不一致時的排查](#token-不一致時的排查)」。
:::

---

## 保護 Webhook 端點（建議）

*此功能需 Sentinel v0.39.1 以上；Token 放入 URL 的方式需 v0.39.4 以上。*

Webhook 端點在未設定 Token 時是開放的寫入路徑——叢集內任何工作負載都可以偽造 admission 事件，而事件保留機制會先淘汰最舊的資料，灌入假事件就能把真實事件擠掉。建議以共用 Token 保護端點。

### 1. 建立 Token Secret

```bash
kubectl -n sentinel-system create secret generic sentinel-audit-webhook \
  --from-literal=token="$(openssl rand -hex 24)"
```

### 2. 將 Token 交給 Sentinel

在 `deploy/sentinel.yaml` 的 container spec 中加入環境變數：

```yaml
        env:
        - name: AUDIT_WEBHOOK_TOKEN
          valueFrom:
            secretKeyRef:
              name: sentinel-audit-webhook
              key: token
```

重新 apply 後，Sentinel 的 webhook 端點即要求所有請求附上此 Token（以常數時間比對）。**未設定 `AUDIT_WEBHOOK_TOKEN` 時端點維持開放**，既有環境不受影響。

### 3. 將同一個 Token 加到 Webhook URL 尾端

修改 `/etc/kubernetes/audit-webhook.yaml`，把 Token 直接附加在 `server` URL 的**最後面**：

```yaml
clusters:
  - name: sentinel
    cluster:
      server: http://<sentinel-clusterip>/api/admission-events/webhook/<token>
```

:::caution 務必放在 URL，不要放 kubeconfig 的 `user.token`
client-go 對 **plain HTTP** 的伺服器會**靜默拒送 bearer token**——雙方都不會報錯，apiserver 只是不帶 Token 送出，所有請求都被 401 拒絕。URL 會原樣送達，因此 Token 一定到得了；Sentinel 會在寫入 access log **之前**先剝除 URL 中的 Token，不會洩漏到自己的日誌。（若 Sentinel 以 TLS 提供服務，`user.token` 的 bearer 方式也可用。）
:::

### 4. 重啟 kube-apiserver

apiserver 只在啟動時讀取 audit-webhook kubeconfig，僅修改該檔**不會**觸發 static pod 重啟，需手動重啟：

```bash
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/ && sleep 5 && \
  sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
```

---

## Token 不一致時的排查

Sentinel 設定了 Token 但 apiserver 的 kubeconfig 缺少（或值不同）時，audit 事件會被拒絕並**無聲地停止出現**——Admission Events 頁面單純不再有來自 `audit` 來源的新事件。兩個地方可以看到原因：

**Sentinel 端**（最多每分鐘印一行）：

```bash
kubectl -n sentinel-system logs deploy/sentinel | grep audit-webhook
# audit-webhook: rejected a request whose bearer token is missing or wrong — ...
# its audit events are NOT being recorded
```

**kube-apiserver 端**（static pod，位於 control plane 節點）：

```bash
kubectl -n kube-system logs kube-apiserver-<node> | grep -i audit
# ... Failed to send audit events ... the server has asked for the client to
# provide credentials
```

修正 `/etc/kubernetes/audit-webhook.yaml` 中的 Token 後，依上方方式重啟 kube-apiserver 即生效。最常見的錯誤原因是把 Token 放在 kubeconfig 的 `user.token` 而非 URL——在 plain HTTP 下 client-go 會靜默丟棄 bearer token，apiserver 完全不帶 Token 送出，且任何一端都不會有錯誤訊息。
