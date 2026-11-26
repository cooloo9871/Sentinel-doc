---
id: image-lockdown
title: Image Lockdown
sidebar_position: 7
---

# Image Lockdown

## Overview

Image Lockdown is a Tracing Policy nobody fills in. Choose a Deployment, StatefulSet or DaemonSet, and its containers may run only **the executable files their images came with**, and only when **started by the container's own processes**:

- A tool downloaded or written into the container after it started is not on the list and is stopped
- A command sent in with `kubectl exec` is not started by the container and is stopped

K8s Sentinel reads the list of executables from a running container on the node, and reads it again when the workload's images change, so there is nothing to maintain by hand.

---

## Locking a Workload

1. Open the **Tracing Policy** page and click **+ Image Lockdown** at the top right
2. In the dialog, choose the **Namespace** and the **Workload** (the select lists that namespace's Deployments, StatefulSets and DaemonSets)
3. Choose the **Mode**: it starts at `Monitoring`, and watching for a while before switching to `Protect` is recommended
4. Click **Lock**. The button reads `Reading the image...` while K8s Sentinel reads the container's executables on the node

When it is done the message is `<workload> locked to its image`, and the Tracing Policy list has a new policy named **`image-lock-<workload name>`** (namespaced, in the workload's namespace).

| Case | Message |
|---|---|
| The workload is already locked | `a policy named "image-lock-<name>" already exists` |
| The workload has no running pod | `the workload has no running pod to read its image from` |
| The images have too many executables for one policy | `the images have more executable files than one policy can list` |

This needs Manage on Tracing Policy (see [Roles and Permissions](./roles.md)). An account limited to namespaces can lock only the workloads of its own namespaces.

---

## Managing the Policy

The policy sits in the same list as every other Tracing Policy and is handled the same way, with one difference: **its list is kept by K8s Sentinel and is not edited**.

| Action | Description |
|---|---|
| **View** | Takes the place of `Edit` and opens the YAML read-only. A change through the API is refused: `this policy's list is read from the workload's images and is not edited; switch its mode, or delete it` |
| **Mode** | Switched in the list between `Monitoring` and `Protect` like any other policy, see [Execution Mode](./execution-mode.md) |
| **Delete** | Deleting the policy removes the lock |

When the images change (a rollout, for example), K8s Sentinel reads the list again and updates the policy, which keeps its mode and its author. During a rollout both images are running and the executables of both are listed.

---

## When `kubectl exec` Is Not Stopped

When the workload meets any of these, commands sent in from outside are **left alone** and only the file list applies:

- It has an exec probe or an exec lifecycle hook
- It uses `shareProcessNamespace`
- It uses `hostPID`

The kubelet's own commands arrive the same way `kubectl exec` does, so stopping them would fail the probes and hooks. The message after locking says so: `<workload> locked to its image. kubectl exec is not stopped for this workload.`

---

## Worth Knowing

:::warning[In Protect you cannot run commands from outside either]
While the policy is in Protect, nobody can run a command in the container with `kubectl exec`, including for debugging. Set the policy to Monitoring first when you need to get in.
:::

- **Everything the image has may run, by path**: a shell or `curl` that ships in the image can still be run by whoever gets into the application; only what was added afterwards is stopped
- **The list is paths, not contents**: a listed file overwritten in place still runs; a script handed to an interpreter the image has (`sh x.sh`, `python x.py`) is the interpreter running; so is a new binary run through the image's own loader. A read-only root filesystem closes the first; nothing here closes the other two
- **Rolling out a new image**: a new image's files can only be read once a container of it runs, which K8s Sentinel checks every 15 seconds. Until then a file that is new in that image is treated as not belonging. Between versions of one image most paths are the same and nothing happens; a move to a different base image has its first seconds stopped. Roll out in Monitoring when the image changes that much
- **A container's first seconds are not covered**: Tetragon puts a new container under a policy a moment after it starts, so a file written and run in that time runs
- **Executables on volumes are not listed**: only the image's own filesystem is, so a script mounted from a ConfigMap and run directly is stopped
- **Init containers are left alone**
- **Deployments, StatefulSets and DaemonSets only**: Jobs, bare pods and workloads of other controllers are not offered

- **Each Image Lockdown is one Tracing Policy**: it counts towards the cluster's limit of 127 Tracing Policies, and one past the limit is marked **Not active** and does nothing, see [Not active](./tracing-policy.md#not-active)

Verified on containerd (runc) and CRI-O (crun and runc) with Tetragon 1.8.0.

---

## How It Works

K8s Sentinel creates a `TracingPolicyNamespaced` for the workload, marked with the annotation `sentinel.io/image-lock: <Kind>/<name>`. When the kernel is about to run a file the policy checks two conditions, either of which fires:

| Condition | What it stops |
|---|---|
| The process is not descended from the container's first process | `kubectl exec`, and anything started from the node |
| The file about to run is not on the list | A file added after the container started |

- The policy's pod selector is the workload's own selector
- The list is read the way [Behavior Discovery](./behavior-discovery.md) reads the paths processes were started by: a fixed script run in the `tetragon` container on the node, so it needs the same Role and RoleBinding `sentinel-tetragon-exec` from `deploy/sentinel.yaml`
- A file written after the container started is left out when the list is made, so a tool already dropped into the container before locking does not become allowed by being there
- Events appear in [Security Events](./notifications.md) like those of any other Tracing Policy: recorded in Monitoring, and the process is killed in Protect
