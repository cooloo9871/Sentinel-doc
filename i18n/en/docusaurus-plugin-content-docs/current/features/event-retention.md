---
id: event-retention
title: Event Retention
sidebar_position: 16
---

# Event Retention

## About This Feature

The Event Retention page lets administrators configure data retention policies for Security Events and Admission Events. You can set the maximum number of events stored (by count) and the automatic cleanup period (TTL in days) to balance storage usage against audit requirements.

---

## Settings Page

Navigate to **"Settings → Event Retention"** to access the retention configuration, which is divided into two tabs.

![Event Retention settings page](/img/features/retention/overview.png)

---

## Security Events Retention

In the **"Security Events"** tab, configure the retention policy for Tetragon kprobe security events:

| Setting | Description | Default | Range |
|---|---|---|---|
| **Max Warning Events** | Maximum number of Warning-severity events to retain; oldest events are removed when this limit is exceeded | 500 | 1 – 5,000 |
| **Max Critical Events** | Maximum number of Critical-severity events to retain | 300 | 1 – 2,000 |
| **TTL (days)** | Maximum age of events in days; events older than this are removed regardless of count | 7 | 1 – 90 days |

Click **"Save"** to apply the settings. The page shows a **Total capacity** summary reflecting the configured maximums.

---

## Admission Events Retention

Switch to the **"Admission Events"** tab to configure the same retention settings for ValidatingAdmissionPolicy violation events.

---

## How Cleanup Works

The Sentinel backend triggers automatic cleanup on two independent conditions:

1. **Count exceeded** — when the number of events at a given severity exceeds the configured maximum, the oldest events are deleted first
2. **TTL expired** — the backend periodically scans the database and removes all events older than the configured TTL

Both conditions operate independently — an event is removed if either applies.

:::warning
Reducing the maximum event count or shortening the TTL does not immediately delete existing events that exceed the new limits. Cleanup happens on the next scheduled background sweep. For long-term retention, use the **Syslog** feature to forward events to an external logging system before they expire.
:::
