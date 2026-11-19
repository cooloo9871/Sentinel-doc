---
id: namespace-access
title: Limiting an Account to Namespaces
sidebar_position: 14
---

# Limiting an Account to Namespaces

## Overview

Since v0.80.0 an account can be limited to some namespaces: it sees and manages only what is in them. This can be set when the account is created or later; accounts you already have keep the whole cluster.

The role still applies inside the namespaces: a **limited Admin** creates and edits there, a **limited Viewer** reads. The same holds for the roles of your own since v0.82.0: inside its namespaces a limited account creates and edits what its role manages and reads what its role views, see [Roles and Permissions](./roles.md). Where this page says "limited Admin", with a role of your own it means a limited account whose role has Manage on that area.

:::info[A division of work inside a team, not isolation between tenants]
The limit is enforced by the server on **every request and event stream**, not by hiding pages. But the Network Topology shows the names of every namespace and workload, so this is suited to dividing work inside a team, not to isolating tenants that do not trust each other.
:::

---

## Setting the Access

### When Creating an Account

Under **Settings → Users**, click **+ New User**, choose **Selected namespaces** under **Access** and tick the namespaces. At least one namespace has to be ticked, or the account cannot be created.

![Access on the New User form](/img/features/users/new-user.png)

### For an Existing Account

In the user list, click **Access** on the account, choose **Whole cluster** or **Selected namespaces**, then **Save**.

![Access dialog](/img/features/users/access-dialog.png)

- The change **takes effect at once**, including in a session the account already has open; no new login is needed
- A limited account's namespaces are shown as badges beside its name in the user list
- **An account cannot limit itself**, so one that manages the others always remains

---

## What a Limited Account Sees

| Page | A limited account |
|---|---|
| **Tracing Policy**, **Network Policy** | Policies in its namespaces only. Cluster-wide policies are neither listed nor writable |
| **Behavior Discovery**, **Security Events**, **Admission Events**, **Vulnerabilities (Workloads)**, **Quarantine** | Its namespaces only |
| **Network Topology** | Whole, since a connection has two ends and the far one is seldom its own. Quarantine from the topology works on its own pods only |
| **Templates** | Read, and used to make policies. Adding, editing and deleting templates is for an Admin of the whole cluster, since they are shared by everyone |
| **Admission Policy** | Since v0.81.0 a limited Admin makes policies and bindings for its own namespaces; see the next section |
| **Registries**, **Event Sources**, **Audit Log**, all of **Settings**, the **Set all to Monitoring** button on the Tracing Policy list | Hidden, and refused by the API. Notifications (Alerts, Syslog) and System belong to the cluster and stay out of reach of a limited account whatever its role |

Further notes:

- An event caused by a cluster-wide policy on one of its pods **is shown**, with the policy's name
- A limited account's sidebar holds only Dashboard, Network Topology, Vulnerabilities → Workloads, Policies and Notifications (Security Events, Admission Events); the header does not show the "N / M in Protect" badge either. Since v0.82.0, entries the role cannot view are absent as well
- Opening the address of a hidden page directly sends a limited account back to the Dashboard
- Since v0.81.2 the namespace filter on the Tracing Policy and Network Policy lists no longer offers `Cluster-wide` to a limited account

---

## Admission Policies of a Limited Admin

Kubernetes has no namespaced admission policy, so K8s Sentinel marks each policy a limited Admin makes with the namespaces it is for (the `sentinel.io/namespaces` annotation) and holds it to them:

| Limit | Description |
|---|---|
| **The binding must be "Only these namespaces"** | And only among the account's own. All namespaces, All except, and selecting by any other label are refused. The binding form offers a limited account this mode only |
| **The policy matches namespaced resources only** | `scope: Namespaced` is set on every rule, because a binding's namespace selector does not keep a policy off nodes, cluster roles or other cluster-scoped resources |
| **It binds only its own policies** | Not the cluster's, and it cannot change or delete a binding the cluster's Admin made for its namespace |
| **Parameters are refused** | Except the scan counts the [vulnerability rules](./vulnerability-admission.md) read. A policy could otherwise be written to read out any object in a refusal message |
| **A name some binding already refers to cannot be used** | When the name is taken by a policy or binding the account cannot see, the message says that it already exists and to choose another (v0.81.1) |

Who sees these policies:

- A limited account lists only policies marked for namespaces that are **all its own**; accounts of the same namespaces share them
- A new policy is marked for **all** the namespaces its author has, so an account with only some of them does not see it
- An Admin of the whole cluster sees everything, with the namespaces shown beside the name; editing such a policy keeps the mark and the narrowing

:::note[Handing a policy to the cluster]
To turn such a policy into an ordinary cluster policy, remove the mark:

```bash
kubectl annotate validatingadmissionpolicy <name> sentinel.io/namespaces-
```
:::

:::caution[Bindings made by an Admin of the whole cluster are not covered]
Not new, and not changed here: a binding an Admin of the whole cluster limits to namespaces still applies its policy to cluster-scoped resources everywhere when the policy matches them (Apply To: All).
:::

---

## Accounts and Passwords

- A limited Admin **cannot manage accounts** or reset another account's password. Since v0.80.0, resetting another account's password takes an Admin of the whole cluster
- A limited account, like a Viewer, has no place in the UI to change its own password; an Admin of the whole cluster resets it

---

## Known Limits

- A limited account does not see the event source warnings on the Dashboard
- Upgrading to v0.80, v0.81 or v0.82 needs nothing beyond the new image; no manifest has to be re-applied
