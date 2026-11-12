---
id: uninstall
title: Uninstall
sidebar_position: 17
---

:::warning
Uninstalling K8s Sentinel will delete all K8s Sentinel resources, including user accounts and the JWT secret. However, **TracingPolicies that have been created will NOT be automatically deleted**, to avoid disrupting existing cluster security policies. Make sure to back up any necessary data before proceeding.
:::

## Step 1: Delete the K8s Sentinel Deployment and Service

If Trivy Operator is installed (the Job and script installations install it into `sentinel-system` as well since v0.61), remove it with Helm first so that it cleans up its own cluster-scoped resources:

```bash
helm uninstall trivy-operator --namespace sentinel-system
```

The `VulnerabilityReport` resources written by Trivy Operator are stored in the namespaces of the workloads they belong to; delete them as well if you no longer need them:

```bash
kubectl delete vulnerabilityreports --all --all-namespaces
```

Then delete the Deployment and Service:

```bash
kubectl delete deployment -n sentinel-system sentinel
kubectl delete service -n sentinel-system sentinel
```

Or delete all resources at once with the same manifest used for installation (Namespace, RBAC, Deployment, Service; after running it you can skip Step 2 and Step 3):

```bash
kubectl delete -f deploy/sentinel.yaml
```

## Step 2: Delete the Namespace

```bash
kubectl delete namespace sentinel-system
```

**Why:** Deleting a namespace also deletes all resources within it, including Pods, Services, ConfigMaps, Secrets, and more. This operation is irreversible - confirm that no data needs to be retained before proceeding.

## Step 3: Remove RBAC Resources

```bash
kubectl delete clusterrole sentinel
kubectl delete clusterrolebinding sentinel
```

**Why:** ClusterRole and ClusterRoleBinding are cluster-scoped resources that do not belong to any namespace. Deleting the namespace does not remove them - they must be manually cleaned up. The Role and RoleBinding used by registry scanning (`sentinel-registry-scan`) live inside `sentinel-system` and were already deleted together with the namespace.

## Step 4: Clear Persistent Data (Optional)

If K8s Sentinel used a PersistentVolume for data storage, clear it separately:

```bash
kubectl delete pvc -n sentinel-system --all
# If using hostPath, manually delete the data directory on the node
sudo rm -rf /data/sentinel/
```

> Double-check the path before running `sudo rm -rf` - this operation cannot be undone.

## Retaining TracingPolicies

:::info
TracingPolicy CRD resources created by K8s Sentinel are not automatically deleted on uninstall. These Policies will continue to be enforced by Tetragon after uninstallation. If you no longer need them, clean them up manually:

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
