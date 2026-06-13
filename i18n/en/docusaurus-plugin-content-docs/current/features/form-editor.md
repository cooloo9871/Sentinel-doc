---
id: form-editor
title: Form Editor
sidebar_position: 3
---

# Form Editor

## About This Feature

The Form Editor provides a graphical visual interface that lets users configure three types of security rules without writing YAML: Process Rules, File Rules, and Network Rules. Each rule type supports both Whitelist and Blacklist modes to flexibly accommodate different security requirements.

---

## Form / YAML Tab Switching

When creating or editing a TracingPolicy, two tabs are available at the top of the editor.

![Form / YAML tab switching](/img/features/form-editor/tabs.png)

- Click the **"Form"** tab: Enter the graphical form interface with structured fields for security rules
- Click the **"YAML"** tab: Switch to the raw YAML editor to write or paste a complete TracingPolicy YAML directly

Content is kept in sync between the two tabs — switching does not lose any settings you've entered.

---

## Process Rules

Process Rules control which programs (processes/binaries) can run inside a Pod.

![Process Rules section](/img/features/form-editor/process-rule.png)

| Mode | Type | Description |
|---|---|---|
| **NotPostfix (Whitelist)** | Whitelist | Only allows the specified executable paths; all other programs are denied execution |
| **Postfix (Blacklist)** | Blacklist | Blocks the specified executable paths; all other programs can run normally |

**Steps:**

1. Select a Mode in the Process Rules section (Blacklist mode is recommended for initial observation)
2. Click **"+ Add"** to add an executable path, e.g., `/bin/bash`, `/usr/bin/curl`
3. Multiple paths can be added, one per line

**How it works:** Tetragon intercepts all exec calls (`sys_execve` kprobe) at the kernel layer. When a program inside a Pod attempts to execute, Tetragon compares the TracingPolicy rules to determine whether to allow or block the request.

---

## File Rules

File Rules control Pod read/write access to the filesystem.

![File Rules section](/img/features/form-editor/file-rule.png)

| Mode | Type | Description |
|---|---|---|
| **Blacklist** | Blacklist | Blocks the specified file paths; Pod read or write operations to these paths are denied |

**Steps:**

1. Click **"+ Add"** in the File Rules section
2. Enter the file or directory paths to block, e.g., `/etc/passwd`, `/etc/shadow`, `/root/.ssh/`
3. Each rule can be individually configured with the operation type to intercept (Read / Write)

**How it works:** Tetragon monitors all file I/O operations via `sys_read` and `sys_write` kprobes. When a Pod accesses a blocked path, the Policy mode determines whether to record the event only or directly block the operation.

---

## Network Rules

Network Rules control outbound network connections (Egress) initiated by a Pod.

![Network Rules section](/img/features/form-editor/network-rule.png)

| Mode | Type | Description |
|---|---|---|
| **NotDAddr (Whitelist)** | Whitelist | Only allows connections to the specified IP addresses and Ports; all other destinations are blocked |
| **DAddr (Blacklist)** | Blacklist | Blocks connections to the specified IP addresses and Ports; all other destinations can connect normally |

**Steps:**

1. Select a Mode in the Network Rules section
2. Click **"+ Add"** to add a rule
3. Enter the target IP address (e.g., `203.0.113.10`); Port is optional — leave blank to match all ports
4. Multiple IP/Port combinations can be added

**How it works:** Tetragon monitors all TCP connection initiation events via the `tcp_connect` kprobe. When a Pod attempts to establish an outbound connection, Tetragon compares the destination IP and Port against Policy rules and determines whether to block.
