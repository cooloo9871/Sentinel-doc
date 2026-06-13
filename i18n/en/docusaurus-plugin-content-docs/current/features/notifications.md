---
id: notifications
title: Security Events
sidebar_position: 7
---

# Security Events

## About This Feature

The Security Events page displays kprobe events detected by Tetragon in a real-time stream, including all security events that violate TracingPolicy rules. Whether events are recorded in Monitoring mode or blocked in Protect mode, they all appear on this page in real time.

---

## Real-Time Streaming

The backend uses **Server-Sent Events (SSE)** to establish a persistent one-way connection from the server to the browser, continuously pushing newly detected events to the frontend. The browser does not need to poll, which significantly reduces server load and ensures events appear on screen with minimal latency.

---

## Viewing Security Events

Navigate to the **"Security Events"** page. All real-time events are listed in chronological order with the latest event at the top.

![Security Events page](/img/features/notifications/list.png)

**Page elements:**

- **Live indicator**: The green Live indicator at the top of the page means the SSE connection is active and events are being received in real time. If it turns gray or shows "Disconnected", the connection has been interrupted — refresh the page to re-establish the connection
- **Event statistics**: The top banner shows the current cumulative event counts, categorized as Events (total), Warning, and Critical
- **⏸ Pause button**: Click to pause the event stream — the page stops auto-scrolling and freezes the current event list, making it easier to review events carefully; click again to resume live reception

---

## Filtering Events

When there are many events, use the filter features to narrow the display and quickly locate events of interest.

![Filters (Namespace, search box)](/img/features/notifications/filter.png)

| Filter | Description |
|---|---|
| **Namespace filter** | Select a specific Namespace from the dropdown to show only events from Pods in that Namespace |
| **Pod name search** | Enter a Pod name keyword in the search box to instantly filter matching events |
| **Event type** | Switch between `All Events`, `Process`, `File`, and `Network` event types |

Multiple filters can be applied simultaneously — they use AND logic (only events matching all conditions are shown).

---

## Event Severity Levels

Each security event is automatically tagged with a severity level based on the detected behavior:

| Level | Description |
|---|---|
| **Info** | General monitoring events; normal behavior records within expected range, no immediate threat |
| **Warning** | Potentially anomalous behavior, such as accessing unexpected file paths or initiating unusual network connections; requires further review |
| **Critical** | High-risk operations, such as attempting to run privileged programs, accessing highly sensitive system files (`/etc/shadow`, `/root/.ssh/`), or attempting to connect to known malicious IPs; requires immediate action |

---

:::info
The security event database retention period is **7 days**. Events older than 7 days are automatically purged by the system to control storage usage. If you need long-term event retention, consider enabling event export in Sentinel settings to forward events to an external logging system (such as Elasticsearch or Loki) for long-term archiving.
:::
