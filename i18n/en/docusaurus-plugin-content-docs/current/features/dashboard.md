---
id: dashboard
title: Dashboard Overview
sidebar_position: 1
---

# Dashboard Overview

## About This Page

The Dashboard is the home page after logging in to Sentinel. It provides a real-time overview of cluster security monitoring status, including Tetragon Agent health, security event counts, and global protection mode — letting you assess the security posture of your entire cluster at a glance.

---

## Statistics Cards

After logging in, the top of the Dashboard displays four statistics cards providing a real-time snapshot of cluster status.

![Dashboard statistics cards](/img/features/dashboard/overview.png)

| Card | Description |
|---|---|
| **Tetragon Agents** | Total number of Tetragon Agent Pods running in the cluster (one per Node); click to jump to the Agents status page |
| **Security Events** | Total number of security events (kprobe violations) recorded so far; includes both Warning and Critical events |
| **Admission Events** | Total number of Kubernetes admission control violations recorded by ValidatingAdmissionPolicy (VAP) |
| **Global Protect Mode** | Global protection mode toggle state (On / Off); when enabled, all TracingPolicies simultaneously switch to Protect mode |

---

## Tracing Policy Overview

The Dashboard shows the most recently created TracingPolicies (up to 4), including Name, Scope, Mode, Namespace, and creation time. Click **"View all →"** in the top-right corner to navigate to the full TracingPolicy list.

If no TracingPolicies have been created yet, this section displays a **"Create your first policy"** guide button.

![Create your first policy button](/img/features/dashboard/create-first-policy.png)

---

## Admission Policy Overview

The Dashboard shows an Admission Policy summary (Policy count and Binding count). If none exist, it shows a "No admission policies" prompt. Click **"View all →"** to navigate to the Admission Policy page.

---

## How Data Updates

Dashboard statistics are retrieved by the backend querying the Kubernetes API Server and the internal event database. To get the latest data, click the **"Refresh"** button in the top-right corner of the page to trigger an immediate live query, ensuring all cards reflect the current cluster state.
