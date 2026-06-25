---
id: namespace-view
title: Tetragon Agents Status
sidebar_position: 9
---

# Tetragon Agents Status

## About This Page

The Tetragon Agents page provides real-time health monitoring of Tetragon Agent Pods running on each Kubernetes Node in the cluster. Operations teams can use this page to quickly confirm whether Tetragon is functioning normally on every node and track stability indicators such as restart counts.

---

## Viewing Tetragon Agent Status

Navigate to **"Cluster → Tetragon Agents"** to see overall statistics and per-node details.

![Tetragon Agents page](/img/features/namespace/tetragon.png)

**Summary cards:**

| Card | Description |
|---|---|
| **Healthy** | Number of Tetragon Agent Pods currently running normally (green number) |
| **Unhealthy** | Number of Tetragon Agent Pods in an abnormal state (e.g., CrashLoopBackOff, OOMKilled) |
| **Total Agents** | Total number of Pods managed by the Tetragon DaemonSet (typically equals the number of Worker Nodes) |

---

## Per-Agent Card Details

Each Tetragon Agent on a Node is shown as an individual card with the following information:

| Field | Description |
|---|---|
| **Node name** | The Kubernetes Node where this Agent is running; a health status badge (`Healthy` / `Unhealthy`) appears in the top-right corner |
| **Pod** | The shortened name of the Pod created by the Tetragon DaemonSet on this Node |
| **Restarts** | Number of times the Pod has restarted since deployment; shown in orange if restarts > 0 |
| **Started** | Timestamp of the Pod's most recent successful startup |

The page shows the last updated time in the top-right corner. Click **"Refresh"** to manually re-query the latest status.

---

## Why Agent Health Matters

Tetragon is deployed as a **DaemonSet**, meaning every Node must have a functioning Agent to ensure security events from all Pods on that node are captured and processed.

If a Node's Tetragon Agent Pod is in an **Unhealthy** state:
- Security events from all Pods on that node **cannot be detected**
- TracingPolicy Protect mode will be **ineffective** for that node's Pods — creating a security gap

Check this page regularly to ensure all Agents remain Healthy.
