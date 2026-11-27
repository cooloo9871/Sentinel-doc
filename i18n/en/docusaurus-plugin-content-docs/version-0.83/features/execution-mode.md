---
id: execution-mode
title: Execution Mode
sidebar_position: 5
---

# Execution Mode

## Two Execution Modes

Each TracingPolicy in K8s Sentinel supports two execution modes that can be switched flexibly based on deployment stage and validation progress:

| Mode | Description | When to Use |
|---|---|---|
| **Monitoring** | Records detected events only, without blocking any behavior. All policy violations generate security event records, but Pods continue running normally | Initial deployment, observation period, policy validation |
| **Protect** | Records events and actively blocks non-compliant behavior. Process executions or file access that violate Policy rules are directly intercepted by Tetragon | After policy validation is complete and rules are confirmed correct |

---

## Method 1: Inline Switch in the Policy List (Fastest)

The quickest way to switch modes: on the **Tracing Policy list page**, click the **Mode** column dropdown directly and select `Monitoring` or `Protect`.

![Tracing Policy list - Mode column dropdown](/img/v0.83/features/policy/list.png)

The Tetragon Agent applies the new mode within seconds - no need to open the edit page or restart any service.

---

## Method 2: In the Create / Edit Page

When creating a new Policy or clicking **"Edit"** from the list, the **Mode** dropdown in the top-right corner of the page sets the execution mode for that Policy.

![Create Policy page - Mode dropdown](/img/features/policy/create.png)

After changing the mode, click **"Apply"**. The Tetragon Agent applies the change immediately.

---

## Setting Everything Back to Monitoring

Protect is turned on one policy at a time (Method 1 or 2), and there is no switch that puts every policy into Protect at once.

The other direction can be done in one step. While any policy is in Protect, the Tracing Policy list shows a **Set all to Monitoring** button at the top right, which stops every policy blocking at once:

![Set all to Monitoring confirmation dialog](/img/features/mode/set-all-monitoring.png)

Once confirmed, every TracingPolicy and TracingPolicyNamespaced in the cluster is set to Monitoring. Violations are still recorded, only no longer blocked; to block again, Protect has to be turned back on one policy at a time. The change is recorded in the [Audit Log](./audit-log.md).

- The button needs Manage on Tracing Policy (see [Roles and Permissions](./roles.md)) and is not shown to an account limited to namespaces
- The badge in the header and the **Policies in Protect** card on the Dashboard show how many policies are in Protect, for example `2 / 4 in Protect`

:::note[A policy with no conditions does not go into Protect]
A policy whose selector has no conditions (the shape of the "Monitor All Process Executions" template, which reports every call) stays in Monitoring when set to Protect, because killing on every call would stop every process in the pods it selects.
:::

:::warning
Before switching a policy to Protect, make sure its rules have been validated. If a rule is wrong (a Whitelist missing a required executable path, for example), switching may block legitimate services. Watch it in Monitoring for a while first and switch once nothing is flagged by mistake.
:::
