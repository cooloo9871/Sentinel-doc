---
id: network-topology
title: Network Topology
sidebar_position: 10
---

# Network Topology

## Overview

Network Topology visualizes the actual network connections between Pods in the cluster as an interactive graph. The data comes from network traffic observed by **Cilium**, including L7 application-layer information (the page badge shows "Cilium · L7"). Operators can grasp real traffic flows at a glance — no raw event logs to decipher — making it easy to spot anomalous connections and to design [Network Policies](./network-policy.md) from observed behavior.

---

## Viewing the Topology Graph

Open the "**Network Topology**" page and the observed connections render automatically as a node graph.

![Network Topology overview](/img/features/network-topology/overview.png)

**Nodes and legend:**

| Item | Description |
|---|---|
| **Pod node** | A Pod in the cluster, showing its namespace and Pod name |
| **Node node** | A Kubernetes node, showing its name and IP address |
| **External node** | A connection source or destination outside the cluster (e.g. external traffic entering via a node) |
| **Exposed edge** | An edge marked Exposed represents a path where a Pod / Node is directly reachable from outside. Detection sources cover Kubernetes Ingress, Gateway API (HTTPRoute / GRPCRoute, plus TCPRoute / TLSRoute / UDPRoute since v0.41), Istio VirtualService / Gateway, Traefik IngressRoute variants, and Contour HTTPProxy; CRDs that are not installed are skipped silently |
| **×N label** | The number on an edge is the cumulative connection count observed |

---

## Connection Detail

Click any edge to open the **Connection Detail** panel:

![Connection Detail panel](/img/features/network-topology/connection-detail.png)

| Field | Description |
|---|---|
| **Source / Destination** | Pod names and IP addresses of both ends |
| **Connections** | Cumulative connection count |
| **Ports** | Destination ports used, with a count per port |

---

## Filters and View Options

The toolbar at the top offers:

| Element | Description |
|---|---|
| **All namespaces** | Show only connections involving a specific namespace |
| **Pod name...** | Search box to quickly locate a node by name |
| **View menu** | View options: `Hide kube-system` (on by default), `Hide health probes` (on by default), `Exposed only` (show only externally exposed connections), `Auto refresh` (on by default) |
| **Auto Layout** | Re-run the automatic layout of all nodes |
| **Refresh** | Re-query the latest connection data immediately |

---

## Graph Interactions

| Action | Description |
|---|---|
| **Drag a node** | Freely reposition nodes to adjust the layout |
| **Mouse wheel** | Zoom the whole graph in and out |
| **Zoom In / Out** | Precise zoom via the +/- buttons |
| **Fit View** | Scale the graph to fit the window |
| **Toggle Interactivity** | Lock/unlock graph interaction |
| **Mini Map** | Thumbnail in the corner showing your position in the overall topology |

---

## How It Works

Cilium, as the cluster CNI, observes all Pod traffic in the data plane, including L7 protocol information; every node's flows are aggregated behind one gRPC endpoint by **Hubble Relay**. The Sentinel backend (v0.43+) reads the cluster-wide traffic from Relay's `GetFlows` stream, aggregates it by Pod, node and external endpoint, and serves the latest connection graph to the frontend. With `Auto refresh` enabled, the topology updates automatically as new traffic is observed.

This feature therefore requires Cilium with both `hubble.enabled=true` (flow observation) **and** `hubble.relay.enabled=true` (the `hubble-relay` service Sentinel reads) — see [Installing and Configuring Cilium](../installation/cilium-install.md).

:::tip
Let your workloads run under normal traffic for a while to accumulate observations, then base your Network Policy whitelist rules on the connections actually shown in the graph (source, destination and ports). This avoids missing a required connection and breaking a service.
:::
