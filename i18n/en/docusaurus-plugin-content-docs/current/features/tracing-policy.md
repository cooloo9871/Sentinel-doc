---
id: tracing-policy
title: TracingPolicy Management
sidebar_position: 2
---

# TracingPolicy Management

## About This Page

TracingPolicy is a Custom Resource Definition (CRD) defined by Cilium/Tetragon that describes security rules to apply to Pods. Sentinel provides full lifecycle management for TracingPolicies, supporting two scopes:

- **Cluster-scoped**: Applies to all Pods across the entire cluster
- **Namespace-scoped** (TracingPolicyNamespaced): Applies only to Pods within a specified Namespace

---

## Viewing the Policy List

Navigate to the **"TracingPolicy"** page to see all created Policies listed in a table.

![TracingPolicy list page](/img/features/policy/list.png)

**Search and filter bar:**

| Element | Description |
|---|---|
| **Search policy name...** | Enter a keyword to instantly filter policies by name |
| **All Scopes** | Filter by scope: `All Scopes`, `cluster`, or `namespaced` |
| **All Namespaces** | Filter by Namespace (only applies to Namespace-scoped policies) |

**Table columns:**

| Column | Description |
|---|---|
| **Name** | The resource name of the TracingPolicy |
| **Scope** | Scope: `cluster` (cluster-level) or `namespaced` (Namespace-level) |
| **Mode** | Execution mode dropdown — click to switch between `Monitoring` and `Protect` directly in the list |
| **Namespace** | The Namespace a Namespace-scoped Policy belongs to; blank for Cluster-scoped |
| **Created By** | The user account that created this Policy |
| **Created Time** | The creation timestamp of the Policy |
| **Actions** | Available operations: Edit or Delete the Policy |

---

## Creating a New Policy

Click the **"+ New Policy"** button in the top-right corner of the list page to enter the Policy creation page.

![Create Policy form](/img/features/policy/create.png)

Form field descriptions:

- **Policy Name** (required): Resource name of the TracingPolicy; must follow Kubernetes naming conventions (lowercase letters, numbers, and hyphens)
- **Namespace**: Select the target Namespace for this Policy; leave blank to create a Cluster-scoped Policy
- **Mode** (top-right dropdown): Select the initial execution mode; `Monitoring` mode is recommended for initial deployment so you can observe behavior before switching to `Protect`

Click **"Save Changes"** when done.

**How it works:** Sentinel automatically generates the corresponding TracingPolicy or TracingPolicyNamespaced YAML from the form data and creates the resource in the cluster via the Kubernetes API Server. The Tetragon Agent applies the new policy within seconds.

---

## Toggle Global Protect Mode

The top of the TracingPolicy page contains a **Global Protect Mode** banner that lets you switch the execution mode of all Policies in the cluster at once.

![Global Protect Mode toggle](/img/features/mode/monitoring.png)

| State | Banner Text | Effect |
|---|---|---|
| **OFF (default)** | "Protect mode is off — monitoring only, no blocking" | All Policies record events only; no blocking |
| **ON** | "Protect mode is on — all policies are enforcing" | All Policies simultaneously switch to Protect mode |

Click **"Turn On"** — Sentinel batch-updates the `mode` field of all TracingPolicies to `Protect`. The Tetragon Agent takes effect immediately.

Click **"Turn Off"** — Sentinel batch-reverts all Policy `mode` fields to `Monitoring`, restoring record-only mode.

:::warning
Before enabling Global Protect Mode, make sure all TracingPolicies have been thoroughly validated. If a Whitelist is missing required executable paths, switching to Protect mode may block legitimate services. Switch Policies one by one first to confirm no issues before using the global switch.
:::
