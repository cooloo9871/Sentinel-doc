---
id: script-install
title: Local Script Installation
sidebar_position: 3
---

# Local Script Installation

## How It Works

`install.sh` is an interactive bash script that performs the following steps in order:

1. Detects and installs Helm (if not already installed locally)
2. Uses Helm to install Tetragon to the cluster (if not already deployed)
3. Deploys K8s Sentinel to the `sentinel-system` namespace via `kubectl apply`
4. Uses Helm to install Trivy Operator into `sentinel-system` (v0.61+, if not already deployed in the cluster)

The entire installation runs locally, printing progress messages at each step, making it easy to observe the installation status. Ideal for quick evaluation or development/test environments.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/cooloo9871/K8s_Sentinel.git
cd K8s_Sentinel/deploy
```

After cloning, navigate to the `deploy/` directory where the `install.sh` script is located.

---

## Step 2: Grant Execute Permission

```bash
chmod +x install.sh
```

**Why:** Linux systems do not allow direct execution of scripts downloaded from the network by default. You must explicitly grant the execute bit with `chmod +x` before running with `./install.sh`. This is a security mechanism to prevent accidental execution of unknown scripts.

---

## Step 3: Run the Installation Script

```bash
./install.sh
```

**The script executes the following flow:**

1. **Prepare Helm** - When Helm is needed to install Tetragon or Trivy Operator and `helm` is not found locally, the script downloads the latest stable release into a temp directory for its own use (nothing is installed system-wide; cleaned up when the script exits)
2. **Deploy Tetragon** - Skipped when a `tetragon` DaemonSet already exists; otherwise rendered from the official Cilium Helm Chart and applied (`helm template | kubectl apply`) with `tetragon.grpc.address=0.0.0.0:54321`
3. **kubectl apply the K8s Sentinel manifest** - Creates the required Namespace, ServiceAccount, ClusterRole, ClusterRoleBinding, Deployment, and Service resources
4. **Deploy Trivy Operator** - Skipped when a Trivy Operator Deployment already exists in any namespace of the cluster; otherwise installed into `sentinel-system` with `helm install`, using the `trivy-operator-values.yaml` in the same directory (see [Installing Trivy Operator](./trivy-operator.md))

---

## Step 4: Monitor Installation Output

During installation, the script prints progress messages for each phase:

| Output Phase | Description |
|---|---|
| `[helm] not found, downloading to temp dir...` | Helm is not installed locally, so it is downloaded to a temp directory (only appears when needed) |
| `[tetragon] already installed, skipping` | Tetragon already exists in the cluster, skipped |
| `[tetragon] not found, installing latest version...` | Deploying Tetragon and waiting for the DaemonSet to become ready; prints `[tetragon] ready` when done |
| `[sentinel] applying manifests...` | Applying K8s Sentinel Kubernetes resources and waiting for the Deployment to become ready |
| `[trivy-operator] already installed, skipping` | Trivy Operator already exists in the cluster, skipped |
| `[trivy-operator] not found, installing latest version...` | Installing Trivy Operator and waiting for the Deployment to become ready; prints `[trivy-operator] ready` when done |
| `Done. Access via:` | All steps completed |

After installation, the script displays a suggested port-forward command:

```bash
kubectl port-forward -n sentinel-system svc/sentinel 8080:80
```

Copy and run this command locally to open the K8s Sentinel management UI in your browser.

---

## Step 5: Verify Deployment Status

```bash
kubectl get all -n sentinel-system
```

**Expected result:**

- Pod status is `Running`
- Service type is `ClusterIP` with an internal IP assigned

```
NAME                                     READY   STATUS    RESTARTS   AGE
pod/sentinel-7d9f8b6c4-xxxxx            1/1     Running   0          2m

NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/sentinel       ClusterIP   10.96.123.45    <none>        80/TCP     2m

NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/sentinel    1/1     1            1           2m
```

If the Pod does not reach `Running` state, check for detailed error messages:

```bash
kubectl describe pod -n sentinel-system
kubectl logs -n sentinel-system deployment/sentinel
```

---

:::warning[Production Environment Note]
The script automatically downloads Helm and modifies cluster configuration (adding Tetragon and Trivy Operator, creating RBAC resources, etc.). In **production environments**, such automated operations may bypass change review processes. Consider using [Kubernetes Job Installation](./job-install.md) instead for better operational transparency and control.
:::
