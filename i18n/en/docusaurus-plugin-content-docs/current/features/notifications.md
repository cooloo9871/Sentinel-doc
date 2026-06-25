---
id: notifications
title: Security Events
sidebar_position: 8
---

# Security Events

## About This Feature

The Security Events page displays kprobe events detected by Tetragon in a real-time stream, including all security events that violate TracingPolicy rules. Whether events are recorded in Monitoring mode or blocked in Protect mode, they all appear on this page in real time.

---

## Real-Time Streaming

The backend uses **Server-Sent Events (SSE)** to establish a persistent one-way connection from the server to the browser, continuously pushing newly detected Tetragon events to the frontend — no polling required, ensuring events appear with minimal latency.

---

## Viewing Security Events

Navigate to the **"Security Events"** page. Events are listed in reverse chronological order with the most recent at the top.

![Security Events page](/img/features/notifications/list.png)

**Toolbar elements:**

| Element | Description |
|---|---|
| **Live indicator** | Green animated dot means the SSE connection is active and events are being received in real time |
| **⏸ Pause** | Click to pause the event stream; the page freezes the current list for easier review. Click again to resume |
| **Export CSV** | Export the currently displayed event list as a CSV file for offline analysis or archiving |

**Event statistics row:** Shows the total event count in the database, broken down by Warning and Critical.

---

## Filtering Events

Three filters at the top of the page can be applied simultaneously (AND logic):

| Filter | Description |
|---|---|
| **Search pod name...** | Enter a Pod name keyword to instantly filter matching events |
| **All Namespaces** | Select a specific Namespace from the dropdown to show only events from that Namespace |
| **All Events** | Switch event type: `All Events`, `Process` (process events), `File` (file access events), `Network` (network connection events) |

---

## Event Table Columns

| Column | Description |
|---|---|
| **Severity** | Severity level: `Warning` or `Critical` |
| **Rule / Detail** | The rule type that triggered the event (Process Rule / File Rule / Network Rule) and a summary — e.g., the binary name executed or the connection destination IP |
| **Namespace** | The Namespace of the Pod that triggered the event |
| **Pod / Container** | The Pod name and Container name that triggered the event |
| **Policy** | The TracingPolicy name that matched this event |
| **Time** | When the event occurred (relative time, e.g., "just now", "5m ago") |

**Click any event row** to expand an inline detail panel showing the full binary path, container name, connection source and destination, and other raw event data.

![Event detail panel](/img/features/notifications/detail.png)

---

## Event Severity Levels

| Level | Description |
|---|---|
| **Warning** | Potentially anomalous behavior — e.g., executing an unexpected program, accessing an unexpected file path, or initiating an unusual network connection. Requires further review |
| **Critical** | High-risk operations — e.g., attempting to run a privileged program, accessing highly sensitive system files (`/etc/shadow`, `/root/.ssh/`), or connecting to a known malicious IP. Requires immediate action |

---

:::info
The number of retained events and retention period can be configured under **Settings → Event Retention**. The default is up to 500 Warning events, 300 Critical events, and a TTL of 7 days.
:::
