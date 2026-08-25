---
id: audit-webhook
title: Wiring Up the API Server Audit Log
sidebar_position: 6
---

# Wiring Up the API Server Audit Log

K8s Sentinel's "**Admission Events**" feature receives audit events from the API Server through a **Kubernetes Audit Webhook**, recording ValidatingAdmissionPolicy violations. This page shows how to configure the Audit Policy and Webhook on a kubeadm-deployed cluster so the API Server forwards events to K8s Sentinel in real time.

:::note
The following steps must be performed on **every control plane node**. Install K8s Sentinel first - the configuration needs the ClusterIP of the K8s Sentinel Service.
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

First look up the K8s Sentinel Service ClusterIP:

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
      # Replace with your K8s Sentinel service ClusterIP
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
The `/api/admission-events/webhook` endpoint is **open when no token is configured** (its caller is the kube-apiserver, which has no login session). If the cluster runs workloads you do not fully trust, protect it with a token as described in "[Protecting the Endpoint](#protecting-the-endpoint-recommended)" below, so forged events cannot be injected.
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
| `audit-policy-file` | The Audit Policy from Step 1 - decides which requests get recorded |
| `audit-webhook-config-file` | The webhook config from Step 2 - points at K8s Sentinel's receiving endpoint |
| `audit-webhook-batch-max-wait` | Maximum wait before an event batch is sent; `5s` gets events into K8s Sentinel within seconds |
| `audit-log-path` etc. | Also keeps a local audit log file (optional - useful for debugging and compliance) |

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

Trigger an Admission Policy violation (e.g. create a resource that violates a bound policy). Within seconds the event should appear on K8s Sentinel's "**Notifications → Admission Events**" page. Use the **Source** filter on that page to confirm events are arriving from the Audit Log - proof the webhook pipeline is active.

:::info
If no events show up, check in order: (1) the ClusterIP in `audit-webhook.yaml` is correct; (2) the control plane nodes can reach that ClusterIP (`curl -s -o /dev/null -w "%{http_code}" http://<clusterip>/api/admission-events/webhook` should not be a connection error); (3) the kube-apiserver log for audit-webhook errors; (4) if a token is configured, see "[When the Tokens Do Not Match](#when-the-tokens-do-not-match)" below.
:::

---

## Protecting the Endpoint (Recommended)

*Requires K8s Sentinel v0.39.1+; the token-in-URL scheme requires v0.39.4+.*

Without a token the webhook endpoint is an open write path - anything in the cluster could forge admission events, and since retention evicts the oldest first, flooding fakes pushes the real ones out. Protect it with a shared token.

### 1. Create the token Secret

```bash
kubectl -n sentinel-system create secret generic sentinel-audit-webhook \
  --from-literal=token="$(openssl rand -hex 24)"
```

### 2. Give K8s Sentinel the token

Add the environment variable to the container spec in `deploy/sentinel.yaml`:

```yaml
        env:
        - name: AUDIT_WEBHOOK_TOKEN
          valueFrom:
            secretKeyRef:
              name: sentinel-audit-webhook
              key: token
```

After re-applying, K8s Sentinel's webhook endpoint requires the token on every request (compared in constant time). **With `AUDIT_WEBHOOK_TOKEN` unset the endpoint stays open**, so existing setups keep working.

### 3. Append the same token to the webhook URL

Edit `/etc/kubernetes/audit-webhook.yaml` and put the token at the **end of the `server` URL**:

```yaml
clusters:
  - name: sentinel
    cluster:
      server: http://<sentinel-clusterip>/api/admission-events/webhook/<token>
```

:::caution[In the URL - not as a kubeconfig `user.token`]
client-go **silently refuses to send bearer tokens to a plain-HTTP server** - no error is raised anywhere; the apiserver just posts without the token and every delivery is rejected with 401. The URL is sent as-is, so the token always arrives; K8s Sentinel strips it **before** access logging, so it never appears in its own logs. (A `user.token` does work if K8s Sentinel is served over TLS - the endpoint accepts it as a bearer token too.)
:::

### 4. Restart the kube-apiserver

The apiserver reads the audit-webhook kubeconfig only at startup - editing that file alone does **not** restart the static pod. Restart it manually:

```bash
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/ && sleep 5 && \
  sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
```

---

## When the Tokens Do Not Match

If K8s Sentinel has the token but the apiserver's kubeconfig is missing it (or carries a different value), audit events are rejected and **silently stop appearing** - the Admission Events page just shows nothing new from the `audit` source. Two places say why:

**On the K8s Sentinel side** (printed at most once a minute):

```bash
kubectl -n sentinel-system logs deploy/sentinel | grep audit-webhook
# audit-webhook: rejected a request whose bearer token is missing or wrong - ...
# its audit events are NOT being recorded
```

**On the kube-apiserver side** (a static pod, on the control-plane node):

```bash
kubectl -n kube-system logs kube-apiserver-<node> | grep -i audit
# ... Failed to send audit events ... the server has asked for the client to
# provide credentials
```

After fixing the token in `/etc/kubernetes/audit-webhook.yaml`, restart the kube-apiserver as above. The most common cause of a mismatch is carrying the token as a kubeconfig `user.token` instead of in the server URL - over plain HTTP, client-go silently drops bearer tokens, so the apiserver posts with no token at all and no error anywhere says why.
