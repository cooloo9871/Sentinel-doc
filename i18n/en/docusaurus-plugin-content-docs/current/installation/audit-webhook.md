---
id: audit-webhook
title: Wiring Up the API Server Audit Log
sidebar_position: 6
---

# Wiring Up the API Server Audit Log

Sentinel's "**Admission Events**" feature receives audit events from the API Server through a **Kubernetes Audit Webhook**, recording ValidatingAdmissionPolicy violations. This page shows how to configure the Audit Policy and Webhook on a kubeadm-deployed cluster so the API Server forwards events to Sentinel in real time.

:::note
The following steps must be performed on **every control plane node**. Install Sentinel first — the configuration needs the ClusterIP of the Sentinel Service.
:::

---

## Step 1: Create the Audit Policy file

```bash
sudo nano /etc/kubernetes/audit-policy.yaml
```

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Capture Metadata-level events for resource mutations (create/update/patch/delete)
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
    omitStages: ["RequestReceived"]
```

This policy records only the metadata of mutating requests (no full request/response bodies) and skips the `RequestReceived` stage, keeping the audit volume minimal.

## Step 2: Create the Audit Webhook config file

First look up the Sentinel Service ClusterIP:

```bash
kubectl get svc -n sentinel-system sentinel
```

Create the webhook config, filling `server` with the ClusterIP from above:

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
The `/api/admission-events/webhook` endpoint is intentionally **unauthenticated** and accepts audit-event payloads exclusively. Do not send other requests to it, and do not expose it outside the cluster.
:::

## Step 3: Update the kube-apiserver configuration

Edit the kubeadm configmap to add the audit extraArgs and extraVolumes:

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

**Key flags:**

| Flag | Description |
|---|---|
| `audit-policy-file` | The Audit Policy from Step 1 — decides which requests get recorded |
| `audit-webhook-config-file` | The webhook config from Step 2 — points at Sentinel's receiving endpoint |
| `audit-webhook-batch-max-wait` | Maximum wait before an event batch is sent; `5s` gets events into Sentinel within seconds |
| `audit-log-path` etc. | Also keeps a local audit log file (optional — useful for debugging and compliance) |

## Step 4: Apply the configuration to the kube-apiserver static pod

Export the configmap to a file:

```bash
kubectl get cm -n kube-system kubeadm-config \
  -o jsonpath={.data.ClusterConfiguration} > config.yaml
```

Copy `config.yaml` to each control plane node, then apply:

```bash
sudo kubeadm init phase control-plane apiserver --config ./config.yaml
```

## Step 5: Restart kubelet and verify the kube-apiserver is updated

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

## Step 6: Verify the integration

Trigger an Admission Policy violation (e.g. create a resource that violates a bound policy). Within seconds the event should appear on Sentinel's "**Notifications → Admission Events**" page. Use the **Source** filter on that page to confirm events are arriving from the Audit Log — proof the webhook pipeline is active.

:::info
If no events show up, check in order: (1) the ClusterIP in `audit-webhook.yaml` is correct; (2) the control plane nodes can reach that ClusterIP (`curl -s -o /dev/null -w "%{http_code}" http://<clusterip>/api/admission-events/webhook` should not be a connection error); (3) the kube-apiserver log for audit-webhook errors.
:::
