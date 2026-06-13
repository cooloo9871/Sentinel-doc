---
id: index
title: Installation Overview
sidebar_position: 1
---

# Installation Overview

Sentinel offers two installation methods. Choose the one that best fits your use case.

## Comparison

| Method | Use Case | Requirements | Advantages |
|---|---|---|---|
| **Kubernetes Job** | Production / CI pipelines | kubectl access | Automated, no manual steps |
| **Local Script (install.sh)** | Quick evaluation / development | bash + kubectl | Visible steps, easy to observe |

## Common Prerequisites

Regardless of installation method, confirm the following before starting:

- Kubernetes cluster is running (version 1.22+)
- `kubectl` is installed and configured with cluster-admin permissions
- Cilium is deployed to the cluster
- Tetragon is installed (the local script can install it automatically)

Complete all checks in the [Prerequisites](../prerequisites) page before proceeding.

## Recommendation

:::tip Which method should I use?
- **Production environments**: Use [Kubernetes Job Installation](./job-install). The Job runs inside the cluster, ensuring network consistency and making it easy to audit and integrate with automation.
- **Quick evaluation or development**: Use [Local Script Installation](./script-install). The script prints installation progress step by step, making it easy to observe and debug.
:::
