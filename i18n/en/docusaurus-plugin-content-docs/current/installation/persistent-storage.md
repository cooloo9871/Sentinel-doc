---
id: persistent-storage
title: Persistent Storage (PV / PVC)
sidebar_position: 5
---

# Persistent Storage (PV / PVC)

## Why You Need It

In the official K8s Sentinel manifest, the data directory `/data/sentinel` is mounted as an **`emptyDir`**:

```yaml
      volumes:
        - name: data
          emptyDir: {}
```

An `emptyDir` lives and dies with the Pod - **every restart or reschedule wipes all of the following**:

- User accounts and passwords (back to the default `admin` / `admin`)
- Alert rules and Syslog forwarding configs
- Custom Policy Templates
- Security Events / Admission Events history
- System settings such as Session Timeout

For production, mount `/data/sentinel` on a **PersistentVolume**.

:::info[Permissions]
K8s Sentinel runs as a non-root user (`runAsUser: 10001`) and the Deployment sets `fsGroup: 10001`. As long as the storage backend supports Kubernetes fsGroup ownership management (most CSI drivers, local and hostPath volumes do), the volume's group is adjusted to 10001 automatically at mount time. **NFS is the exception** - see below.
:::

---

## Option 1: Dynamic Provisioning with a StorageClass (Recommended)

If the cluster has a StorageClass (Longhorn, Rook-Ceph, a cloud provider CSI, etc.), a PVC is all you need:

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
  # Omit storageClassName to use the cluster default StorageClass
  # storageClassName: longhorn
```

```bash
kubectl apply -f sentinel-data-pvc.yaml
```

The event database is bounded by count limits and TTL (see [Event Retention](../features/event-retention.md)), so `2Gi` is plenty for most environments.

---

## Option 2: Static PV - Local Volume (Single Node / Test)

Without a StorageClass, create a `local` PV that pins the data to a directory on one node:

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
    path: /opt/sentinel-data        # directory on the node, create it first
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - w1                # replace with your node name
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

Create the directory on the target node, then apply:

```bash
# on node w1
sudo mkdir -p /opt/sentinel-data

# on your admin machine
kubectl apply -f sentinel-data-local.yaml
```

:::caution
A `local` PV pins the K8s Sentinel Pod to that node via `nodeAffinity`. If the node fails, the Pod cannot be rescheduled elsewhere. Prefer Option 1 with network storage for production.
:::

---

## Option 3: Static PV - NFS (Shared Across Nodes)

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
    server: 192.168.10.60           # NFS server address
    path: /export/sentinel-data     # NFS export path
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

:::caution[NFS permissions]
NFS does not support Kubernetes fsGroup ownership management. Set the export's owner to UID 10001 on the NFS server yourself:

```bash
sudo chown -R 10001:10001 /export/sentinel-data
```

Otherwise K8s Sentinel fails to start because it cannot write its database.
:::

---

## Mounting the PVC in the K8s Sentinel Deployment

Once the PVC exists (`kubectl get pvc -n sentinel-system` shows `Bound`; with `WaitForFirstConsumer` it stays `Pending` until a Pod mounts it - that's expected), switch the Deployment's `data` volume from `emptyDir` to the PVC:

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

Or edit the manifest (`deploy/sentinel.yaml`) and re-apply:

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:      # replaces the original emptyDir: {}
            claimName: sentinel-data
        - name: tmp
          emptyDir: {}
```

:::note
The `tmp` volume only holds scratch files - keep it as `emptyDir`; it does not need persistence.
:::

The patch triggers a rolling restart and the Pod comes back with the persistent volume mounted.

---

## Verification

Confirm the Pod is running and the PVC is bound:

```bash
kubectl get pods,pvc -n sentinel-system
```

Confirm the database files are on the persistent volume:

```bash
kubectl -n sentinel-system exec deploy/sentinel -- ls -la /data/sentinel
```

Finally, do a real test: log in to K8s Sentinel and change any setting (change the admin password or add an alert rule), then restart the Pod:

```bash
kubectl -n sentinel-system rollout restart deployment sentinel
```

Log in again after the restart - if your change survived, persistence is working.

:::warning
Data previously stored in the `emptyDir` is **not** migrated when you switch to the PVC - K8s Sentinel starts fresh (credentials back to `admin`/`admin`). Set up persistent storage **before** doing your initial configuration (passwords, users, alert rules).
:::

---

## Only Want Sessions to Survive Restarts? (JWT_SECRET)

The session-signing key lives in `/data/sentinel/.jwt-secret` by default. Without a PV it is regenerated on every Pod restart, **logging every user out**. Since v0.53 the **`JWT_SECRET`** environment variable (at least 32 characters) can pin the key, injected from a Kubernetes Secret:

```bash
kubectl -n sentinel-system create secret generic sentinel-jwt \
  --from-literal=jwt-secret="$(openssl rand -hex 32)"
```

```yaml
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sentinel-jwt
              key: jwt-secret
```

- A too-short value **refuses to start** rather than silently weakening every session token
- Unset keeps the existing `.jwt-secret` file behaviour; deployments with a PV need nothing
- Note: `JWT_SECRET` only covers session survival; **accounts, rules and event data still need a PV**
