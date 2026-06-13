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

| Column | Description |
|---|---|
| **Name** | The resource name of the TracingPolicy |
| **Scope** | Scope: `cluster` (cluster-level) or `namespaced` (Namespace-level) |
| **Mode** | Execution mode: `Monitoring` (record only) or `Protect` (record and block) |
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
- **Mode**: Select the initial execution mode; for initial deployment, `Monitoring` mode is recommended so you can observe behavior before switching to `Protect`

Click **"Save Changes"** when done.

**How it works:** Sentinel automatically generates the corresponding TracingPolicyNamespaced YAML structure from the form data and creates the resource in the cluster via the Kubernetes API Server. The Tetragon Agent applies the new policy within seconds.

---

## Toggle Global Protect Mode

The top of the TracingPolicy page contains a **Global Protect Mode** banner that lets you switch the execution mode of all Policies in the cluster at once.

![Global Protect Mode toggle](/img/features/mode/monitoring.png)

**How to use:**

1. When Global Protect Mode is off, the banner shows a **"Turn On"** button
2. Click "Turn On" — Sentinel batch-updates the `mode` field of all TracingPolicies in the cluster to `Protect`
3. The Tetragon Agent takes effect immediately upon receiving the Policy update event, blocking all behavior that violates the rules

**To disable:** Click the toggle button again. Sentinel batch-reverts all Policy `mode` fields to `Monitoring`, restoring record-only mode and stopping any blocking.
