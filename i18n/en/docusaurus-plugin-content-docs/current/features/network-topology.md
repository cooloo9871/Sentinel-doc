---
id: network-topology
title: Network Topology
sidebar_position: 10
---

# Network Topology

## About This Feature

Network Topology visualizes TCP connections between Pods in your cluster using an interactive graph. The data is sourced from network events captured by Tetragon kprobe hooks. This visualization lets operators understand real network traffic flows at a glance — without parsing raw event logs — and helps identify anomalous connections or build precise network security policies.

---

## Viewing the Topology Graph

Navigate to **"Network Topology"** to see observed Pod network connections rendered as a node graph.

![Network Topology overview](/img/features/network-topology/overview.png)

**Legend:**

| Icon | Description |
|---|---|
| **Pod node** | A Pod in the cluster, showing Namespace and Pod name |
| **Service node** | A Kubernetes Service resource |
| **External node** | An IP address outside the cluster that a Pod connected to |
| **Edge (Blocked)** | Red dashed line — a connection attempt blocked by a TracingPolicy in Protect mode |
| **Edge (Allowed)** | Solid line — a successfully established TCP connection |
| **×N label** | Number of times this connection was observed during the collection period |

---

## Filtering and Search

Use the toolbar at the top of the page to narrow the view:

- **Namespace dropdown** — show only Pods in a specific Namespace
- **Pod / Service name search** — type a name to highlight matching nodes

---

## Graph Controls

| Action | Description |
|---|---|
| **Drag nodes** | Move nodes to rearrange the layout manually |
| **Scroll to zoom** | Zoom in or out on the graph |
| **Auto Layout** | Click "Auto Layout" to automatically reposition all nodes |
| **Refresh** | Click "Refresh" to re-fetch the latest connection events from the backend |
| **Fit View** | Click the ⊡ button (bottom-right) to fit the full graph into the viewport |
| **Zoom In / Out** | Use the +/- buttons (bottom-right) for precise zoom control |
| **Mini Map** | The bottom-right minimap shows your current viewport position within the full graph |

---

## How It Works

Tetragon hooks `tcp_connect` kprobe to monitor all TCP connection establishment events, recording the source Pod, destination IP/port, and whether the connection was allowed or blocked. The Sentinel backend continuously collects these events, aggregates them by Pod and destination, and exposes the latest connections via API for the frontend graph renderer.

:::tip
For the best results, enable TracingPolicy Monitoring mode and let your workloads run normally for a period of time before checking Network Topology. With enough events accumulated, the graph will give a complete picture of real connection behavior — helping you craft accurate network Whitelist / Blacklist rules.
:::
