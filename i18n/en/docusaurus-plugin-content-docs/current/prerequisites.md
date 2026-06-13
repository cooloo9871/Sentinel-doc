---
id: prerequisites
title: Prerequisites
sidebar_position: 3
---

# Prerequisites

Before deploying Sentinel, confirm your environment meets all of the following requirements.

## Environment Requirements

| Component | Minimum Version | Notes |
|---|---|---|
| Kubernetes | 1.26+ | Cluster must be running and accessible via kubeconfig |
| Cilium | 1.14+ | Provides the network and eBPF foundation required for Tetragon integration |
| Tetragon | 1.0+ | Deployed as a DaemonSet, providing eBPF security monitoring |
| kubectl | 1.26+ | For local cluster operations; a valid kubeconfig must be configured |
| Access | cluster-admin or TracingPolicy RBAC | Sufficient cluster permissions required for installing Sentinel and operating TracingPolicy CRDs |

## Verify Cilium Installation

Run the following command to confirm the Cilium DaemonSet is running normally:

```bash
kubectl get pods -n kube-system -l k8s-app=cilium
```

All Pods should display `Running` status with a fully ready `READY` column (e.g., `1/1`).

**Why:** Cilium is deployed as a DaemonSet on every node in the cluster and is responsible for loading eBPF programs into the Linux kernel. Confirming that Pods are `READY` means the eBPF programs on the corresponding node have loaded successfully — a prerequisite for Tetragon to function.

## Verify Tetragon Installation

Run the following command to confirm the Tetragon DaemonSet is running (the namespace may vary depending on installation method):

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon
# or
kubectl get pods -n tetragon -l app.kubernetes.io/name=tetragon
```

Each node should have a corresponding Tetragon Pod in `Running` state.

**Why:** The Tetragon DaemonSet deploys one Agent per node, responsible for capturing kprobe security events (syscalls, network connections, file access) via eBPF hooks and forwarding event data to the Sentinel backend for aggregation.

## Verify kubectl Connectivity

Confirm your local kubectl is correctly configured and can communicate with the target cluster:

```bash
kubectl cluster-info
kubectl get nodes
```

`kubectl cluster-info` should display the Kubernetes control plane endpoint address; `kubectl get nodes` should list all cluster nodes with `Ready` status.

## Verify TracingPolicy CRDs

After Tetragon is installed, the TracingPolicy CRDs are automatically registered in the cluster. Verify they exist:

```bash
kubectl get crd | grep tetragon
```

The output should include the following two CRD resources:

- `tracingpolicies.cilium.io`
- `tracingpoliciesnamespaced.cilium.io`

If these CRDs are missing, Tetragon has not completed installation or the CRDs were not applied correctly. Complete the Tetragon installation before continuing.

:::tip
If Tetragon is not yet installed in your environment, refer to the [Tetragon official documentation](https://tetragon.io/docs/installation/kubernetes/) to install via Helm. The Helm method is the current official recommendation for Kubernetes deployments, automatically handling CRD registration, RBAC configuration, and DaemonSet deployment.
:::
