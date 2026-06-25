---
id: admission-events
title: Admission Events
sidebar_position: 12
---

# Admission Events

## About This Feature

The Admission Events page records and displays violation events from Kubernetes **ValidatingAdmissionPolicy**. When a resource operation (create or update) violates an applied Admission Policy, the API Server emits a Warning event. Sentinel receives and stores these events via a webhook endpoint, making them available for real-time review and audit.

---

## Viewing Admission Events

Navigate to **"Admission Events"** to see the list of captured admission violation events.

![Admission Events page](/img/features/admission-events/list.png)

**Page elements:**

| Element | Description |
|---|---|
| **Event counters** | Summary banner showing total events, Warning count, and Critical count |
| **Search box** | Filter by resource name or policy name keyword |
| **Namespace dropdown** | Filter events by a specific Namespace |
| **Event type dropdown** | Show all events or a specific event type |
| **Source dropdown** | Toggle between event sources (Audit Log) |

---

## Event Severity

| Severity | Description |
|---|---|
| **Warning** | Resource violated an Admission Policy rule but was still admitted because `failurePolicy: Warn` was set |
| **Critical** | Resource was rejected by the API Server due to an Admission Policy violation (`failurePolicy: Fail`) |

---

## Configuring Kubernetes Audit Log

Admission Events are sourced from the Kubernetes Audit Webhook. The following steps show how to configure Audit Policy and Webhook on a kubeadm-deployed cluster so the API Server forwards Admission Policy violation events to Sentinel.

:::note
The following steps must be performed on **every control plane node**.
:::

### Step 1: Create the Audit Policy file

```bash
sudo nano /etc/kubernetes/audit-policy.yaml
```

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Capture only rejected admission requests (VAP violations)
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
    omitStages: ["RequestReceived"]
```

### Step 2: Create the Audit Webhook config file

```bash
sudo nano /etc/kubernetes/audit-webhook.yaml
```

```yaml
apiVersion: v1
kind: Config
clusters:
  - name: sentinel
    cluster:
      # Replace with your Sentinel service ClusterIP
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
Replace the IP in the `server` field with your cluster's Sentinel Service ClusterIP. To find it:
```bash
kubectl get svc -n <sentinel-namespace>
```
:::

### Step 3: Update the kube-apiserver configuration

Edit the kubeadm configmap to add Audit-related extraArgs and extraVolumes:

```bash
kubectl edit cm -n kube-system kubeadm-config
```

Under the `ClusterConfiguration.apiServer` section, add:

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

### Step 4: Apply the configuration to the kube-apiserver static pod

Export the configmap to a file:

```bash
kubectl get cm -n kube-system kubeadm-config \
  -o jsonpath={.data.ClusterConfiguration} > config.yaml
```

Copy `config.yaml` to each control plane node, then apply:

```bash
sudo kubeadm init phase control-plane apiserver --config ./config.yaml
```

### Step 5: Restart kubelet and verify the kube-apiserver is updated

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

Confirm the kube-apiserver container has been recreated:

```bash
sudo crictl ps --name kube-apiserver
```

Example output:

```
CONTAINER           IMAGE               CREATED             STATE     NAME             ATTEMPT
eff3881e1f2fc       c3994bc6961024...   3 seconds ago       Running   kube-apiserver   0
```

A `CREATED` time of a few seconds ago confirms the restart was successful.

---

:::info
Admission Events retention settings (max event count and TTL) can be configured in **Settings → Event Retention** under the "Admission Events" tab.
:::
