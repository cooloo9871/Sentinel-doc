---
id: persistent-storage
title: 設定永久儲存（PV / PVC）
sidebar_position: 5
---

# 設定永久儲存（PV / PVC）

## 為什麼需要

Sentinel 官方 manifest 中的資料目錄 `/data/sentinel` 預設掛載的是 **`emptyDir`**：

```yaml
      volumes:
        - name: data
          emptyDir: {}
```

`emptyDir` 的生命週期跟著 Pod 走，**只要 Pod 重啟或被重新調度，以下資料就會全部歸零**：

- 使用者帳號與密碼（回到預設 `admin` / `admin`）
- Alerts 告警規則與 Syslog 轉送設定
- 自訂 Policy Templates
- Security Events / Admission Events 歷史事件
- Session Timeout 等系統設定

正式環境請務必將 `/data/sentinel` 改掛 **PersistentVolume**。

:::info 權限需求
Sentinel 以非 root 身分執行（`runAsUser: 10001`），Deployment 已設定 `fsGroup: 10001`。只要儲存後端支援 Kubernetes 的 fsGroup 權限調整（多數 CSI 驅動、local、hostPath 皆支援），掛載時會自動將卷的群組改為 10001，無需手動處理；**NFS 為例外**，見下方說明。
:::

---

## 方式一：StorageClass 動態供應（建議）

若叢集已有 StorageClass（例如 Longhorn、Rook-Ceph、雲端供應商的 CSI），只需建立 PVC：

```yaml title="sentinel-data-pvc.yaml"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sentinel-data
  namespace: sentinel-system
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  # 省略 storageClassName 則使用叢集預設 StorageClass
  # storageClassName: longhorn
```

```bash
kubectl apply -f sentinel-data-pvc.yaml
```

事件資料庫有筆數上限與 TTL 控管（見 [Event Retention](../features/event-retention.md)），`2Gi` 對多數環境已相當充裕。

---

## 方式二：靜態 PV（Local Volume，單節點 / 測試環境）

沒有 StorageClass 時，可手動建立 `local` 類型的 PV，將資料固定存在某個節點的目錄：

```yaml title="sentinel-data-local.yaml"
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: sentinel-local
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: sentinel-data-pv
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: sentinel-local
  local:
    path: /opt/sentinel-data        # 節點上的實體目錄，需事先建立
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - w1                # 替換為實際的節點名稱
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sentinel-data
  namespace: sentinel-system
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: sentinel-local
  resources:
    requests:
      storage: 2Gi
```

先在目標節點上建立目錄，再套用：

```bash
# 在 w1 節點上執行
sudo mkdir -p /opt/sentinel-data

# 在管理機上執行
kubectl apply -f sentinel-data-local.yaml
```

:::caution
`local` PV 透過 `nodeAffinity` 將 Sentinel Pod 綁定在該節點上。若該節點故障，Pod 將無法在其他節點重新調度。正式環境建議改用方式一的網路儲存。
:::

---

## 方式三：靜態 PV（NFS，多節點共用）

```yaml title="sentinel-data-nfs.yaml"
apiVersion: v1
kind: PersistentVolume
metadata:
  name: sentinel-data-pv
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: sentinel-nfs
  nfs:
    server: 192.168.10.60           # NFS 伺服器位址
    path: /export/sentinel-data     # NFS 匯出路徑
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sentinel-data
  namespace: sentinel-system
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: sentinel-nfs
  resources:
    requests:
      storage: 2Gi
```

:::caution NFS 權限注意
NFS 不支援 Kubernetes 的 fsGroup 自動調整，請在 NFS 伺服器上手動將匯出目錄的擁有者設為 UID 10001：

```bash
sudo chown -R 10001:10001 /export/sentinel-data
```

否則 Sentinel 會因無法寫入資料庫而啟動失敗。
:::

---

## 將 PVC 掛載至 Sentinel Deployment

PVC 建立完成後（`kubectl get pvc -n sentinel-system` 顯示 `Bound`，使用 `WaitForFirstConsumer` 時會停在 `Pending` 直到 Pod 掛載，屬正常現象），將 Deployment 的 `data` volume 從 `emptyDir` 改為 PVC：

```bash
kubectl -n sentinel-system patch deployment sentinel --patch '
spec:
  template:
    spec:
      volumes:
        - name: data
          emptyDir: null
          persistentVolumeClaim:
            claimName: sentinel-data
'
```

或直接編輯 manifest（`deploy/sentinel.yaml`）後重新 apply：

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:      # 原本的 emptyDir: {} 改為這兩行
            claimName: sentinel-data
        - name: tmp
          emptyDir: {}
```

:::note
`tmp` volume 只存放暫存檔，維持 `emptyDir` 即可，不需要持久化。
:::

Patch 後 Deployment 會自動滾動重啟 Pod 並掛上新的儲存卷。

---

## 驗證

確認 Pod 正常啟動且 PVC 已綁定：

```bash
kubectl get pods,pvc -n sentinel-system
```

確認資料庫檔案已寫入永久儲存：

```bash
kubectl -n sentinel-system exec deploy/sentinel -- ls -la /data/sentinel
```

最後做一次實際測試：登入 Sentinel 修改任意設定（例如變更 admin 密碼或新增一條 Alert 規則），接著重啟 Pod：

```bash
kubectl -n sentinel-system rollout restart deployment sentinel
```

Pod 重啟後重新登入，若剛才的變更仍然存在，代表永久儲存設定成功。

:::warning
掛上 PVC 的當下，先前存在 `emptyDir` 中的資料**不會**自動搬移，Sentinel 會以全新狀態啟動（帳號回到 `admin`/`admin`）。建議在完成初始設定（修改密碼、建立使用者與告警規則）**之前**就先設定好永久儲存。
:::
