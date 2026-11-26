---
id: quarantine
title: Pod Quarantine
sidebar_position: 18
---

# Pod Quarantine

## Overview

Quarantine gives you one-click Pod network isolation for incident response. When a Pod shows suspicious behavior in Security Events, you can isolate it immediately: **the Pod is cut off from the network but keeps running** - its process, memory and open files stay intact for forensic investigation.

---

## How It Works

![Quarantine page](/img/features/quarantine/page.png)

Quarantine behaves as follows:

- **All traffic in and out is blocked, except the kubelet's health probes.** Keeping the probes alive is deliberate - without them the Pod would be restarted and replaced by a fresh, uncontained one, destroying the evidence and giving the threat its network back.
- **The state is the Pod's `sentinel.io/quarantine=true` label**, so it survives a K8s Sentinel restart.
- Isolation is enforced by one cluster-wide Cilium policy, **`sentinel-quarantine`**, which selects that label. It is created the first time it is needed. It is read-only in the Network Policy list and cannot be edited from there.
- **A Pod that is deleted and recreated comes back without the label**, and so without the quarantine. If the threat may return with the recreated workload, combine quarantine with other policies.

---

## Quarantining a Pod

There are two ways in: the detail of a Security Event, and a pod on the Network Topology. Quarantining from the "**Notifications → Security Events**" page comes first.

1. Find the security event for the suspicious behavior and click the row to expand its detail panel
2. Click the "**Quarantine this pod**" button at the bottom right of the panel

![Quarantine button in a Security Event detail](/img/features/quarantine/event-quarantine.png)

3. A confirmation dialog restates the impact: the Pod loses all network access; the container keeps running, so anything it serves stops

![Quarantine confirmation dialog](/img/features/quarantine/confirm-dialog.png)

4. Click "**Quarantine**" to confirm - the Pod is isolated immediately

### Quarantine From the Network Topology

There is no need to wait for a Security Event to name a pod. Click a pod on the [Network Topology](./network-topology.md) and its **Pod Detail** panel offers the same **Quarantine this pod** button: for a pod seen connecting out, or being reached from outside.

![Pod Detail panel on the Network Topology with the Quarantine this pod button](/img/features/quarantine/topology-quarantine.png)

- It asks first, naming the namespace and pod
- Once confirmed, the node turns red with a lock at once, and the panel says "This pod is quarantined. Release it from the Quarantine page."
- It needs Manage on Quarantine (the built-in Admin, or a role of your own that has it, see [Roles and Permissions](./roles.md)); external addresses and nodes cannot be quarantined
- An Admin limited to namespaces can quarantine only pods in its own namespaces (see [Limiting an Account to Namespaces](./namespace-access.md))
- Releasing works as before, see the next section

---

## Viewing and Releasing

Open "**Policies → Quarantine**" to see all currently quarantined Pods, including **who asked and when**. When nothing is quarantined, the page shows "Nothing is quarantined".

Once the investigation is complete, **Release** the Pod from this page (which removes the `sentinel.io/quarantine` label) and it regains normal network connectivity. Because the state lives on the Pod's label, a release also works without the UI:

```bash
kubectl label pod <pod-name> -n <namespace> sentinel.io/quarantine-
```

:::note[Manual only]
Automatic quarantine on a policy violation is **deliberately not provided**: the Tracing Policy form defaults to whitelist mode, where anything *not* listed fires, so one mis-scoped policy could contain an entire Deployment in seconds.
:::

---

:::warning
Quarantine interrupts everything the Pod serves. If the Pod belongs to a multi-replica workload such as a Deployment, the remaining replicas keep serving - isolating a single replica usually does not cause a full outage - but confirm the blast radius before you proceed.
:::

:::tip
Quarantine works best as a "**contain first, investigate second**" move: the Pod's processes and memory stay intact after isolation, so you can safely `kubectl exec` or `kubectl debug` into the container to collect evidence without worrying about further lateral movement.
:::
