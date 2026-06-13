---
id: behavior-discovery
title: Behavior Discovery
sidebar_position: 6
---

# Behavior Discovery

## About This Feature

Behavior Discovery is Sentinel's automated learning feature. Without creating any TracingPolicy in advance, it automatically collects and analyzes the actual execution behavior (process calls) of each Pod in the cluster — letting you build precise security policies based on real workload behavior rather than manually guessing which programs should be allowed.

---

## How It Works

After Tetragon is installed, its **base sensor** starts by default and records process events for all Pods in the cluster, including each process's execution path, parent process, and associated Namespace and Pod information. Sentinel continuously collects these raw events, groups and aggregates them by workload (Deployment / DaemonSet), and presents a readable behavior summary for review.

This feature requires no pre-existing TracingPolicy — it continuously accumulates observation data in the background.

---

## Viewing the Behavior Discovery Page

Navigate to the **"Behavior Discovery"** page. Observation results are displayed as a card grid, with each card representing a workload (Deployment or DaemonSet).

![Behavior Discovery page](/img/features/discovery/overview.png)

**Page elements:**

- **Workload cards**: Each card shows the workload name, its Namespace, and a list of unique process execution paths detected during the observation period
- **Namespace filter**: Located at the top of the page; select a specific Namespace to narrow the display and focus on a particular application
- **Search box**: Enter a workload name keyword to quickly locate the target workload

---

## Create a Policy from Discovery Results

After confirming that the workload behavior summary matches expectations, you can generate a TracingPolicy directly from the Behavior Discovery page with one click.

![Create Policy button annotation](/img/features/discovery/generate-policy.png)

**Steps:**

1. Find the target workload in the card grid
2. Click the **"Create Policy"** button on the card
3. Sentinel automatically generates a TracingPolicy draft pre-populated with the observed data and opens the Policy editor for review and adjustment
4. Click **"Save Changes"** to save and apply after confirming the rules

**How it works:** Based on all unique process execution paths recorded during the observation period, Sentinel automatically generates a TracingPolicy using **NotPostfix (Whitelist)** mode, allowing only those paths that were observed and deemed normal. Any program that did not appear during the observation period will be blocked once the Policy switches to Protect mode.

---

:::tip
Let your workload run through a complete normal business cycle for **24 to 48 hours** before creating Policies from Behavior Discovery results. A shorter observation period may miss some legitimate but infrequent programs (such as scheduled tasks or backup scripts), resulting in an incomplete Whitelist that blocks normal services when switching to Protect mode.
:::
