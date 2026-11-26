---
id: tracing-policy
title: TracingPolicy Management
sidebar_position: 2
---

# TracingPolicy Management

## About This Page

TracingPolicy is a Custom Resource Definition (CRD) defined by Cilium/Tetragon that describes security rules to apply to Pods. K8s Sentinel provides full lifecycle management for TracingPolicies, supporting two scopes:

- **Cluster-scoped**: Applies to all Pods across the entire cluster
- **Namespace-scoped** (TracingPolicyNamespaced): Applies only to Pods within a specified Namespace

---

## Viewing the Policy List

Navigate to the **"TracingPolicy"** page to see all created Policies listed in a table.

![TracingPolicy list page](/img/features/policy/list.png)

**Toolbar:**

| Element | Description |
|---|---|
| **Search by name...** | Enter a keyword to instantly filter policies by name |
| **All namespaces** | Filter by Namespace (only applies to Namespace-scoped policies) |
| **Refresh** | Re-query the latest policy list |
| **+ New Policy / + New YAML** | Create a new policy with the form editor or the YAML editor |
| **+ Image Lockdown** | Choose a workload whose containers may then run only the executables their images came with, see [Image Lockdown](./image-lockdown.md) |

**Table columns:**

| Column | Description |
|---|---|
| **Name** | The resource name of the TracingPolicy. A long name is cut short, with the full name on hover. A policy Tetragon did not load is marked **Not active** beside its name, see [Not active](#not-active) below |
| **Scope** | Scope: `cluster` (cluster-level) or `namespaced` (Namespace-level) |
| **Mode** | Execution mode dropdown - click to switch between `Monitoring` and `Protect` directly in the list |
| **Namespace** | The Namespace a Namespace-scoped Policy belongs to; blank for Cluster-scoped |
| **Created By** | The user account that created this Policy; policies created with `kubectl apply` show `k8s-apply` |
| **Created Time** | The creation timestamp of the Policy |
| **Actions** | `Edit` and `Delete`. A policy made by [Image Lockdown](./image-lockdown.md) shows `View` and opens read-only |

:::note[How Edit opens]
- **Policies created in K8s Sentinel**: open in the form editor when the form can represent them, otherwise in the YAML editor
- **Policies applied with `kubectl`** (Created By is `k8s-apply`): always open directly in the **YAML editor**, showing the YAML as its author wrote it - a save from the form would rewrite field order, quoting and comments, leaving the file in git no longer matching the cluster
:::

---

## Creating a New Policy

K8s Sentinel offers two ways to write a policy yourself (for one with nothing to fill in, see [Image Lockdown](./image-lockdown.md)):

- **"+ New Policy"**: the graphical form editor, with the rules on the left and a live **Generated YAML** preview on the right (see [Form Editor](./form-editor.md))
- **"+ New YAML"**: a full-screen YAML editor for writing a complete TracingPolicy manifest (see [YAML Editor](./yaml-editor.md))

![Create Policy form](/img/features/policy/create.png)

Common settings:

- **Policy Name** (required): Resource name of the TracingPolicy; must follow Kubernetes naming conventions (lowercase letters, numbers, and hyphens)
- **Namespace**: Select the target Namespace to create a `TracingPolicyNamespaced`, or choose **cluster-wide** to create a cluster-scoped `TracingPolicy`
- **Mode** (top-right dropdown): Select the initial execution mode; `Monitoring` mode is recommended for initial deployment so you can observe behavior before switching to `Protect`

Click **"Apply"** when done.

**How it works:** K8s Sentinel automatically generates the corresponding TracingPolicy or TracingPolicyNamespaced YAML from the form data and creates the resource in the cluster via the Kubernetes API Server. The Tetragon Agent applies the new policy within seconds. A create answers as soon as the resource is written and does not wait for Tetragon; a policy Tetragon did not load is marked **Not active** in the list a few seconds later.

:::note
- Creating a policy under a name that already exists is refused instead of replacing the existing policy
- A policy the form cannot fully represent opens in the YAML editor, so no field is lost on save
:::

---

## Not active

A policy that exists in the cluster is not thereby loaded by Tetragon. When Tetragon fails to load a policy on any node, the list marks it with a red **Not active** beside its name, with Tetragon's reason on hover. Such a policy exists and **does nothing**.

- Nothing is shown for a policy that is in force
- The mark comes from asking Tetragon on every node when the list is read (an answer is reused for 10 seconds). A policy Tetragon does not list yet, or is still loading, is not marked; nor is anything when no Tetragon answers
- A policy just created is marked only once Tetragon has reached it, usually a few seconds later: click **Refresh** to check

### At most 127 Tracing Policies in a cluster

Tetragon holds 128 policies on a node, one of which it keeps for itself, and loads every policy on every node. A cluster therefore holds **at most 127 Tracing Policies**, counted over every kind together: policies written by hand, policies made from Behavior Discovery and each [Image Lockdown](./image-lockdown.md).

A policy past the limit is still created, does nothing, and is marked **Not active** in the list.

:::caution[Deleting other policies does not bring it to life]
A policy that failed to load for want of room is not loaded again when room is made. **Delete it and create it again.**
:::

The limit is fixed in Tetragon ([cilium/tetragon#4191](https://github.com/cilium/tetragon/issues/4191)) and was measured on Tetragon 1.8.0.

---

## Setting Everything Back to Monitoring

Protect is turned on one policy at a time, in the **Mode** column of the list.

While any policy is in Protect, the list shows a **Set all to Monitoring** button at the top right, which stops every policy blocking at once.

![Set all to Monitoring confirmation dialog](/img/features/mode/set-all-monitoring.png)

See [Execution Mode](./execution-mode.md).
