---
id: execution-mode
title: Execution Mode
sidebar_position: 5
---

# Execution Mode

## Two Execution Modes

Each TracingPolicy in Sentinel supports two execution modes that can be switched flexibly based on deployment stage and validation progress:

| Mode | Description | When to Use |
|---|---|---|
| **Monitoring** | Records detected events only, without blocking any behavior. All policy violations generate security event records, but Pods continue running normally | Initial deployment, observation period, policy validation |
| **Protect** | Records events and actively blocks non-compliant behavior. Process executions, file access, or network connections that violate Policy rules are directly intercepted by Tetragon | After policy validation is complete and rules are confirmed correct |

---

## Per-Policy Mode Setting

Each TracingPolicy can have its execution mode set independently at creation time, without affecting other Policies.

**How to set:**

1. When creating a new Policy, select `Monitoring` or `Protect` in the **"Mode"** field
2. After creation, click **"Edit"** in the Actions column on the TracingPolicy list page at any time to change the mode
3. Click **"Save Changes"** to save — the Tetragon Agent applies the new mode within seconds

---

## Global Protect Mode (Bulk Switch)

In addition to switching individual Policy modes one by one, Sentinel provides a **Global Protect Mode** feature that switches all TracingPolicies in the cluster to the same execution mode with one click.

![Global Protect Mode toggle](/img/features/mode/monitoring.png)

The Global Protect Mode toggle banner is located at the top of the TracingPolicy page, showing the current global mode status.

### Enable Global Protect Mode

**Action:** Click the **"Turn On"** button on the banner

**How it works:** The Sentinel backend receives the request, queries all TracingPolicy and TracingPolicyNamespaced resources in the cluster, and batch-updates each Policy's `mode` field to `Protect`. The Tetragon Agent, upon detecting the CRD resource change event, immediately reloads the rules — no Agent restart required.

### Disable Global Protect Mode

**Action:** Click the toggle button on the banner again

**How it works:** Sentinel batch-reverts all TracingPolicy `mode` fields in the cluster to `Monitoring`. After the Tetragon Agent receives the update, it immediately switches back to record-only mode and stops blocking all behavior.

---

:::warning
Before enabling Global Protect Mode, make absolutely sure all TracingPolicies in the cluster have been thoroughly validated. If a rule is incorrectly configured (e.g., a Whitelist is missing a required executable path), switching to Protect mode may block legitimate business traffic or critical services, causing service outages. We recommend validating in a test environment first, or switching Policies to Protect mode one by one to confirm no issues before enabling the global switch.
:::
