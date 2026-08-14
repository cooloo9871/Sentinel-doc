---
id: network-policy
title: Network Policy
sidebar_position: 17
---

# Network Policy

## Overview

The Network Policy page provides visual management of **Cilium Network Policies**. You can define Ingress and Egress network access rules between Pods through a graphical form — no hand-written YAML required. Sentinel automatically generates the corresponding `CiliumNetworkPolicy` resource from the form and applies it to the cluster.

As of this version, Pod-level network access control is handled by Cilium Network Policy (the Network Rules section has been removed from the TracingPolicy form): TracingPolicy focuses on process- and file-level security, while network-level allow/deny rules are managed here.

---

## Viewing the Policy List

Open "**Policies → Network Policy**" to see all existing Network Policies in a table.

![Network Policy list page](/img/features/network-policy/list.png)

**Table columns:**

| Column | Description |
|---|---|
| **Name** | Resource name of the CiliumNetworkPolicy |
| **Scope** | Shows the namespace for namespaced policies; cluster for cluster-wide policies |
| **Applies to** | The Pod label selector this policy governs (e.g. `app=backend`) |
| **Rules** | Rule count summary: `in N` for N ingress rules, `out N` for N egress rules |
| **Default Deny** | The direction(s) where this policy causes a default deny (`Ingress` / `Egress`); in Whitelist mode, traffic not listed in any rule is rejected |
| **Created By** | The user account that created this policy |
| **Created Time** | Full creation timestamp |
| **Actions** | `Edit` (open the edit page) and `Delete` (with a confirmation dialog) |

The toolbar at the top provides a "**Search by name...**" box and an "**All namespaces**" filter.

---

## Creating a Policy (Form)

Click "**+ New Policy**" to open the graphical builder — the form is on the left, with a live **Generated YAML** preview on the right.

![New Network Policy form](/img/features/network-policy/new-form.png)

### Basic fields

| Field | Required | Description |
|---|---|---|
| **Name** | ✅ | Policy resource name, must follow Kubernetes naming rules |
| **Scope** | ✅ | `Namespaced` (the selector only matches pods in that namespace, generates `CiliumNetworkPolicy`) or `Cluster-wide` (generates `CiliumClusterwideNetworkPolicy`) |
| **Namespace** | Required when namespaced | The namespace the policy belongs to |
| **Comment** | — | Free-form note to help your team understand the policy's purpose |
| **Applies to** | ✅ | key=value labels selecting the target Pods this policy governs (`endpointSelector`); at least one label is required |

### Ingress / Egress rules

The Ingress and Egress sections are configured independently and share the same structure. **A direction with no rules is left out of the policy** (traffic in that direction is unaffected).

**Mode (set per direction):**

| Mode | Description |
|---|---|
| **Whitelist** | Only traffic listed in the rules is allowed; everything else is rejected (creating a default deny for that direction) |
| **Blacklist** | Only traffic listed in the rules is blocked; everything else is allowed |

**Per-rule settings:**

| Field | Description |
|---|---|
| **From / To — kind** | Peer type: `Labels` (select peers by Pod label) or `Entity` (a reserved Cilium identity, which has no labels to select) |
| **From / To** | For Labels: one or more key=value labels; for Entity: choose from `world`, `cluster`, `host`, `remote-node`, `all`, `init`, `health`, `unmanaged` |
| **Peer namespace** | (Optional, Labels only) restrict peers to a specific namespace |
| **Ports** | Optional; click "**+ Add Port**" to add a port and protocol (TCP / UDP). Leave empty for no port restriction |
| **L7 — HTTP rules** | Optional; click "**+ Add HTTP rule**" to filter by HTTP method and path. An HTTP rule requires at least one port |

A validation checklist below the form lists anything still missing; the "**Apply**" button is enabled once everything passes. Clicking Apply creates the policy and applies it to the cluster.

**How it works:** Sentinel generates the `CiliumNetworkPolicy` (or `CiliumClusterwideNetworkPolicy`) YAML from the form and creates the resource through the Kubernetes API Server. The Cilium CNI enforces it in the data plane immediately; L7 HTTP rules are handled by Cilium's Envoy proxy.

---

## Creating a Policy from YAML

Click "**+ New YAML**" to switch to a full-screen YAML editor and write or paste a complete Cilium Network Policy manifest.

Scope is determined by the manifest kind — `CiliumNetworkPolicy` is namespaced, `CiliumClusterwideNetworkPolicy` is not. Click "**Apply**" when done.

---

:::info
Network Policy requires **Cilium** as the cluster CNI. If the cluster was deployed with Sentinel's install script, Cilium is already included.
:::

:::tip
Before writing whitelist rules, check the "**Network Topology**" page to observe the actual connections between Pods (source, destination and ports). Basing rules on observed traffic helps avoid missing a required connection and breaking a service.
:::
