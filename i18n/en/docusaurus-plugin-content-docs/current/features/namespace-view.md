---
id: namespace-view
title: Namespace & Cluster Info
sidebar_position: 8
---

# Namespace & Cluster Info

## About This Page

The Namespace & Cluster Info page provides two important cluster status overviews: the TracingPolicy distribution across Namespaces, and the health status of Tetragon Agents on each node. Through this page, operations teams can quickly confirm security policy coverage and get real-time visibility into Tetragon's per-node health.

---

## Namespace List

The Namespace list shows all Namespaces in the cluster and their TracingPolicy configuration.

![Namespaces list](/img/features/namespace/view.png)

**Column descriptions:**

- **Namespace**: Kubernetes Namespace name
- **TracingPolicy count**: Number of Namespace-scoped TracingPolicies currently applied in this Namespace
- **Status**: Whether the Namespace is in a managed state

**How it works:** The Sentinel backend queries all Namespaces in the cluster via the Kubernetes API Server List API and simultaneously counts the number of TracingPolicyNamespaced resources in each Namespace, associating the two and presenting them in the list. The page auto-refreshes periodically to reflect the latest cluster state.

---

## Tetragon Agent Health Status

Tetragon is deployed as a **DaemonSet** in the Kubernetes cluster, ensuring one Tetragon Agent Pod runs on each Worker Node to intercept and handle security events at the kernel layer. The Agent Health Status section shows the real-time status of each node's Agent.

![Tetragon Agent health status](/img/features/namespace/tetragon.png)

**Summary statistics:**

| Metric | Description |
|---|---|
| **Total Agents** | Total number of Pods managed by the Tetragon DaemonSet (typically equals the number of Worker Nodes) |
| **Healthy** | Number of Tetragon Agent Pods currently running normally |
| **Unhealthy** | Number of Tetragon Agent Pods currently in an abnormal state (e.g., CrashLoopBackOff, OOMKilled) |

**Per-Agent card information:**

Each Agent is displayed as an individual card containing:

- **Node name**: The Kubernetes Node where this Agent is running
- **Pod name**: The full name of the Pod created by the Tetragon DaemonSet on this node
- **Restarts**: Number of times the Pod has restarted since deployment; a high restart count may indicate Agent stability issues
- **Start time**: The timestamp of the Pod's most recent successful startup

**Important:** Tetragon is deployed as a DaemonSet, meaning every node must have a functioning Agent to ensure security events from all Pods on that node are captured. If a node's Tetragon Agent Pod is in an abnormal state (shown as Unhealthy), security events from all Pods on that node cannot be detected, and the TracingPolicy Protect mode will be ineffective for that node's Pods — creating a security gap. Check this page regularly to ensure all Agents remain Healthy.
