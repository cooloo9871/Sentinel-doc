---
id: dashboard
title: Dashboard Overview
sidebar_position: 1
---

# Dashboard Overview

## About This Page

The Dashboard is the home page after logging in to Sentinel. It provides an overview of cluster security policy statistics. From the Dashboard, you can quickly understand the current number of TracingPolicies, execution modes, and global protection status — without navigating to individual sub-pages.

---

## Statistics Cards

After logging in, the top of the Dashboard displays four statistics cards providing a real-time snapshot of cluster security status.

![Dashboard statistics cards](/img/features/dashboard/overview.png)

| Card | Description |
|---|---|
| **Total Policies** | Total number of TracingPolicies created in the cluster, including both Cluster-scoped and Namespace-scoped types |
| **Protect Mode** | Number of Policies currently set to Protect mode; in Protect mode, Tetragon actively blocks non-compliant behavior |
| **Namespaces** | Number of Kubernetes Namespaces currently managed by Sentinel |
| **Global Protect Mode** | Global protection mode toggle state (On / Off); when enabled, all Policies simultaneously switch to Protect mode |

---

## Create Your First Policy

If no TracingPolicies have been created in the cluster, the Dashboard displays a guide button to help you complete the initial setup.

![Create your first policy button](/img/features/dashboard/create-first-policy.png)

Click **"Create your first policy"** to navigate to the TracingPolicy creation page, where you can create your first security policy using the Form Editor or YAML Editor.

---

## How Data Updates

Dashboard statistics are retrieved by the backend periodically querying the Kubernetes API Server, then cached server-side to reduce API call frequency. To get the latest data, click the **"Refresh"** button in the top-right corner of the page to trigger an immediate live query, ensuring statistics reflect the current cluster state.
