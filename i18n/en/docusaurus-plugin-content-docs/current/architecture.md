---
id: architecture
title: Architecture
sidebar_position: 2
---

# Architecture

## System Architecture Diagram

The diagram below illustrates the deployment relationships and communication paths between K8s Sentinel components:

```mermaid
graph TD
    A["Browser (React SPA)"] -->|"HTTP/REST + SSE"| B["Go Backend (port 8080)"]
    B -->|"Kubernetes API"| C["K8s Cluster"]
    B -->|"gRPC GetEvents (per node)"| D["Cilium Tetragon (eBPF)"]
    B -->|"gRPC GetFlows"| H["Hubble Relay"]
    C --> D
    D --> E["TracingPolicy CRD"]
    B -->|"/data/sentinel/"| F["Persistent Storage"]
```

## Component Overview

| Component | Technology | Description |
|---|---|---|
| Frontend | TypeScript + React + Vite + shadcn/ui | Web UI delivered as an SPA, providing TracingPolicy management, event viewing, and cluster monitoring |
| Backend | Go 1.x + HTTP Server (port 8080) | RESTful API service with a built-in Kubernetes client, handling cluster communication and user authentication |
| Cilium Tetragon | eBPF DaemonSet | Security observation agent deployed on every Kubernetes node, capturing syscalls and file access at the kernel layer via eBPF; K8s Sentinel collects events per node over gRPC (`GetEvents`) |
| Hubble Relay | Cilium component | Aggregates every node's network flows behind one gRPC endpoint; K8s Sentinel reads its `GetFlows` stream as the data source for Network Topology |
| TracingPolicy | Kubernetes CRD (cilium.io/v1alpha1) | Custom Resource Definition that defines the kprobe rules and security policies Tetragon should enforce |
| Persistent Storage | /data/sentinel/ | Local persistence path: user accounts, the JWT signing key, alert and syslog configs, custom templates, event history and the Audit Log |

## Data Flow

The sequence diagram below shows the complete flow when a user creates a new TracingPolicy through K8s Sentinel:

```mermaid
sequenceDiagram
    participant B as Browser
    participant BE as Backend
    participant K8s as K8s API
    participant T as Tetragon Agent

    B->>BE: POST /api/policies (submit TracingPolicy definition)
    BE->>K8s: create TracingPolicy (call Kubernetes API to create CRD resource)
    K8s-->>BE: creation success response
    K8s->>T: notify Tetragon Agent to apply new policy
    T->>T: load kprobe (load eBPF program at kernel layer)
    T-->>K8s: status update (policy is active)
    BE-->>B: confirmation response (Policy created successfully)
```

## Deployment Architecture

K8s Sentinel uses a **single binary deployment** model that greatly simplifies the installation process.

The Go backend embeds the frontend React SPA's static files (HTML, JavaScript, CSS) at compile time using `embed.go`. Deployment requires only copying and running a single executable - no additional web server or static file service needed.

Persistent data is stored at the following paths:

| Path | Purpose |
|---|---|
| `/data/sentinel/users.json` | User accounts and password hashes |
| `/data/sentinel/.jwt-secret` | The JWT token signing key, auto-generated on first startup |
| `/data/sentinel/` (rest) | Alert / syslog configs, custom policy templates, Security / Admission event history and the Audit Log |
