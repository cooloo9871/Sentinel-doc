---
id: job-install
title: Kubernetes Job Installation
sidebar_position: 2
---

# Kubernetes Job Installation

## How It Works

Sentinel uses a Kubernetes Job to run the installation script, automatically creating the required ServiceAccount, ClusterRole, ClusterRoleBinding, Deployment, and Service. The entire installation flow uses Kustomize to manage YAML resources, ensuring consistency and reproducibility.

The key advantage of the Job method is that the installation runs entirely inside the cluster, without depending on the local environment — ideal for CI/CD pipelines or environments where running local bash scripts is not practical.

---

## Step 1: Clone the Repository

**Action:** Get the deployment configuration files

```bash
git clone https://github.com/cooloo9871/Sentinel.git
cd Sentinel
```

**Why:** The `deploy/` directory contains all Kubernetes deployment manifests and the installation Job definition, including `install-job.yaml` and Kustomize-managed resource YAMLs.

---

## Step 2: Apply install-job.yaml

**Action:** Create the installation Job

```bash
kubectl apply -f deploy/install-job.yaml
```

**Why:** This command submits a Kubernetes Job resource to the cluster. The Job starts a Pod inside the cluster and runs the installation script. Compared to a local script, this ensures network consistency and avoids issues caused by local firewall or proxy settings.

---

## Step 3: Confirm Job Completion

```bash
kubectl get jobs -n sentinel-system
kubectl logs -n sentinel-system job/sentinel-install
```

**Why:** Once the Job completes successfully, the `COMPLETIONS` column shows `1/1`, indicating all Kubernetes resources have been created. Use `kubectl logs` to view the detailed output of the installation script and confirm each resource was created correctly.

Expected output:

```
NAME               COMPLETIONS   DURATION   AGE
sentinel-install   1/1           30s        2m
```

---

## Step 4: Confirm Pod is Ready

```bash
kubectl get pods -n sentinel-system
kubectl get svc -n sentinel-system
```

**Expected output:**

- `sentinel-XXXX` Pod status is `Running`
- Service `sentinel-svc` is created, showing a ClusterIP

```
NAME                        READY   STATUS    RESTARTS   AGE
sentinel-7d9f8b6c4-xxxxx    1/1     Running   0          3m

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
sentinel-svc    ClusterIP   10.96.123.45    <none>        8080/TCP   3m
```

If the Pod status is `Pending` or `CrashLoopBackOff`, use `kubectl describe pod <pod-name> -n sentinel-system` to view detailed events.

---

## Persistent Storage (Optional)

:::info About Persistent Storage
To retain user settings and TracingPolicy data across Pod restarts, configure a PersistentVolume before deploying and mount it to the container at `/data/sentinel/`.

Create and verify the PV/PVC configuration before running `kubectl apply -f deploy/install-job.yaml`:

```bash
# Verify PV configuration (optional)
kubectl get pv,pvc -n sentinel-system
```

See the [Kubernetes official documentation](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for PersistentVolume configuration details.
:::
