---
id: uninstall
title: Uninstall
sidebar_position: 17
---

:::warning
Uninstalling Sentinel will delete all Sentinel resources, including user accounts and the JWT secret. However, **TracingPolicies that have been created will NOT be automatically deleted**, to avoid disrupting existing cluster security policies. Make sure to back up any necessary data before proceeding.
:::

## Step 1: Delete the Sentinel Deployment and Service

Delete the Deployment and Service individually:

```bash
kubectl delete deployment -n sentinel-system sentinel
kubectl delete service -n sentinel-system sentinel-svc
```

Or use Kustomize to delete all resources managed by `deploy/base/` at once:

```bash
kubectl delete -k deploy/base/
```

## Step 2: Delete the Namespace

```bash
kubectl delete namespace sentinel-system
```

**Why:** Deleting a namespace also deletes all resources within it, including Pods, Services, ConfigMaps, Secrets, and more. This operation is irreversible — confirm that no data needs to be retained before proceeding.

## Step 3: Remove RBAC Resources

```bash
kubectl delete clusterrole sentinel-role
kubectl delete clusterrolebinding sentinel-rolebinding
```

**Why:** ClusterRole and ClusterRoleBinding are cluster-scoped resources that do not belong to any namespace. Deleting the namespace does not remove them — they must be manually cleaned up.

## Step 4: Clear Persistent Data (Optional)

If Sentinel used a PersistentVolume for data storage, clear it separately:

```bash
kubectl delete pvc -n sentinel-system --all
# If using hostPath, manually delete the data directory on the node
sudo rm -rf /data/sentinel/
```

> Double-check the path before running `sudo rm -rf` — this operation cannot be undone.

## Retaining TracingPolicies

:::info
TracingPolicy CRD resources created by Sentinel are not automatically deleted on uninstall. These Policies will continue to be enforced by Tetragon after uninstallation. If you no longer need them, clean them up manually:

```bash
# List all TracingPolicy resources
kubectl get tracingpolicy,tracingpolicynamespaced --all-namespaces

# Delete a specific TracingPolicyNamespaced
kubectl delete tracingpolicynamespaced <name> -n <namespace>
```

To delete a cluster-level TracingPolicy:

```bash
kubectl delete tracingpolicy <name>
```
:::
