---
id: form-editor
title: Form Editor
sidebar_position: 3
---

# Form Editor

## About This Feature

The Form Editor provides a graphical visual interface that lets users configure four sections of security rules without writing YAML: Pod Selector, Process Rules, File Rules, and Network Rules. A **YAML Preview** panel on the right side updates in real time as you edit the form, so you can always confirm what the generated YAML looks like.

---

## Form / YAML Tab Switching

When creating or editing a TracingPolicy, two tabs are available at the top of the editor.

![Form / YAML tab switching](/img/features/form-editor/tabs.png)

- Click the **"Form"** tab: Enter the graphical form interface with the YAML Preview panel on the right side updating live
- Click the **"YAML"** tab: Switch to a full-screen YAML editor to write or paste a complete TracingPolicy YAML directly

Content is kept in sync between the two tabs — switching does not lose any settings you've entered.

---

## Execution Mode (Mode)

The **Mode** dropdown in the top-right corner of the create/edit page sets the execution mode for this Policy:

| Mode | Description |
|---|---|
| **Monitoring** | Records detected events only, without blocking any behavior |
| **Protect** | Records events and actively blocks non-compliant behavior |

This setting is independent of the form content and can be changed at any time.

---

## Pod Selector

The Pod Selector section lets you restrict this TracingPolicy's rules to specific Pods, rather than applying them to all Pods in the Namespace.

**Steps:**

1. Click **"+ Add Label"** to add a key=value label selector condition
2. Multiple labels can be added; all conditions use AND logic (a Pod must match all labels to be governed by this Policy)
3. Leave Pod Selector empty to apply the Policy to all Pods in the Namespace (or cluster-wide for Cluster-scoped Policies)

---

## Process Rules

Process Rules control which programs (processes/binaries) can run inside a Pod.

![Process Rules section](/img/features/form-editor/process-rule.png)

**Mode options:**

| Mode | Type | Description |
|---|---|---|
| **NotPostfix — Whitelist** | Whitelist | Only allows the specified executable paths; all other programs are denied execution |
| **Postfix — Blacklist** | Blacklist | Blocks the specified executable paths; all other programs can run normally |

**Steps:**

1. Select a Mode from the Process Rules dropdown
2. Click **"+ Add"** to add an executable path, e.g., `/bin/bash`, `/usr/bin/curl`
3. Multiple paths can be added

**How it works:** Tetragon intercepts all exec calls (`sys_execve` kprobe) at the kernel layer. When a program inside a Pod attempts to execute, Tetragon compares the TracingPolicy rules to determine whether to allow or block the request.

---

## File Rules

File Rules control Pod read/write access to the filesystem. File Rules always use **Blacklist** mode.

![File Rules section](/img/features/form-editor/file-rule.png)

**Blacklist:** Only the paths you list are blocked. Everything else is allowed.

**Steps:**

1. Click **"+ Add"** in the File Rules section
2. Enter the file or directory paths to block, e.g., `/etc/passwd`, `/etc/shadow`, `/root/.ssh/`
3. Multiple paths can be added

**How it works:** Tetragon monitors all file I/O operations via `sys_read` and `sys_write` kprobes. When a Pod accesses a blocked path, the Policy mode determines whether to record the event only or directly block the operation.

---

## Network Rules

Network Rules control outbound TCP connections (Egress) initiated by a Pod.

![Network Rules section](/img/features/form-editor/network-rule.png)

**Mode options:**

| Mode | Type | Description |
|---|---|---|
| **NotDAddr — Whitelist** | Whitelist | Only allows connections to the specified IP addresses; all other destinations are blocked |
| **DAddr — Blacklist** | Blacklist | Blocks connections to the specified IP addresses; all other destinations can connect normally |

**Configuration sections:**

- **Addresses**: Click **"+ Add"** to add a target IP address (e.g., `203.0.113.10`)
- **Ports** (optional): Click **"+ Add Port"** to add a destination port; leave empty to match all ports. The port condition is ANDed with the address condition — a connection must match both IP and port to trigger the rule

**How it works:** Tetragon monitors all TCP connection initiation events via the `tcp_connect` kprobe. When a Pod attempts to establish an outbound connection, Tetragon compares the destination IP and Port against Policy rules to determine whether to block.
