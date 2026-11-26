---
id: behavior-discovery
title: Behavior Discovery
sidebar_position: 6
---

# Behavior Discovery

## About This Feature

Behavior Discovery is K8s Sentinel's automated learning feature. Without creating any TracingPolicy in advance, it automatically collects and analyzes the actual execution behavior (process calls) of each Pod in the cluster - letting you build precise security policies based on real workload behavior rather than manually guessing which programs should be allowed.

---

## How It Works

After Tetragon is installed, its **base sensor** starts by default and records process events for all Pods in the cluster, including each process's execution path, parent process, and associated Namespace and Pod information. K8s Sentinel continuously collects these raw events, groups and aggregates them by workload (Deployment / DaemonSet / Pod), and presents a readable behavior summary for review.

This feature requires no pre-existing TracingPolicy - it continuously accumulates observation data in the background.

### Processes That Were Running Before Tetragon

A process rule matches the path a process **is started by**. For a process that was already running when Tetragon started, Tetragon has only the file the kernel loaded, with links followed: a `sleep` that is a link to `coreutils` shows as `coreutils`, `/bin/sh` as `busybox` or `dash`. A whitelist built from those names refuses the real ones the next time the pod starts.

K8s Sentinel lists these processes by the path they were started by (`/usr/bin/sleep`, `/bin/sh`). Processes that were already running are also learned within a minute when Tetragon is installed or restarted while K8s Sentinel is running, or a node joins.

Tetragon's API does not carry the started-by path, so K8s Sentinel reads it on the node, by running one fixed script in the `tetragon` container that takes process IDs and nothing else. That needs the Role and RoleBinding **`sentinel-tetragon-exec`** that `deploy/sentinel.yaml` adds (in `kube-system`, granting `pods/exec`).

:::warning[How far this permission reaches]
Kubernetes cannot grant exec for one kind of pod, so this is exec in **every pod** of that namespace, Tetragon's privileged ones included: someone who takes over K8s Sentinel can get onto the nodes with it. To do without, delete them:

```bash
kubectl -n kube-system delete rolebinding,role sentinel-tetragon-exec
```

Everything else keeps working. Those processes are then listed by the file the kernel loaded, and K8s Sentinel's log says so; check those entries before turning a profile into a whitelist.
:::

- Where Tetragon is installed outside `kube-system`, create the Role and RoleBinding in its namespace and delete the pair in `kube-system`
- Known gap: a script started by its `#!` line is listed as the interpreter in this case, not as the script
- A started-by path is believed only when it really leads to the file the process is running, so a process cannot get itself listed under another program's name; container runtimes (`crun`, `/dev/fd/3`) do not appear among a pod's processes either

---

## Viewing the Behavior Discovery Page

Navigate to the **"Behavior Discovery"** page. Observation results are displayed as a card grid, with each card representing a workload.

![Behavior Discovery page](/img/features/discovery/overview.png)

**Page elements:**

| Element | Description |
|---|---|
| **Stats counter** | Shows "N workloads · N pods total" in the top-right corner - the current count of observed workloads and Pods |
| **Namespace filter** | Select a specific Namespace to narrow the display |
| **Search pod...** | Enter a Pod name keyword to quickly locate workload cards containing that Pod |
| **Group by namespace** | Toggle to group cards by Namespace |
| **Clear All** | Clear all accumulated Behavior Discovery data and start learning fresh |

**Workload card details:**

Each card contains:

- **Resource type badge**: `Deployment`, `DaemonSet`, or `Pod`
- **Workload name**: The name of the Deployment / DaemonSet / Pod
- **Namespace · Pod count**: The owning Namespace and number of managed Pods
- **Process list**: Unique executable paths detected during the observation period (showing binary names; hover to see full paths) along with execution counts
- **since X ago**: How long ago this card's observation data started accumulating

---

## Create a Policy from Discovery Results

After confirming that the workload behavior summary matches expectations, you can generate a TracingPolicy directly from the Behavior Discovery page with one click.

![Create Policy button](/img/features/discovery/generate-policy.png)

**Steps:**

1. Find the target workload card in the grid
2. Click the **"Create Policy"** button on the card
3. K8s Sentinel generates a TracingPolicy draft and opens it in the form editor: the Policy Name and Namespace are pre-filled, the Pod Selector carries the workload's labels, and the Process Rules list every observed executable path in **Whitelist** mode
4. Review and adjust the rules as needed, then click **"Apply"**

**How it works:** Based on all unique process execution paths recorded during the observation period, K8s Sentinel automatically generates **Whitelist**-mode Process Rules, allowing only those paths that were observed and deemed normal. Any program that did not appear during the observation period will be blocked once the Policy switches to Protect mode.

---

:::tip
Let your workload run through a complete normal business cycle for **24 to 48 hours** before creating Policies from Behavior Discovery results. A shorter observation period may miss some legitimate but infrequent programs (such as scheduled tasks or backup scripts), resulting in an incomplete Whitelist that blocks normal services when switching to Protect mode.
:::
