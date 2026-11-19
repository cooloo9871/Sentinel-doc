---
id: roles
title: Roles and Permissions
sidebar_position: 14
---

# Roles and Permissions

## Overview

Since v0.82.0, what an account may do is decided by its **role**. A role grants each of eight parts of the product separately, at **None**, **View** or **Manage**, so you can make a role that only views events, or one that manages Network Policy and views events, instead of choosing between Admin and Viewer only.

- **Admin** and **Viewer** are built in and keep their meaning, so existing accounts need no change
- Other roles are made under **Settings → Roles**
- An account has one role, which can be changed in the **Access** dialog under **Settings → Users**

![Roles list](/img/features/roles/list.png)

---

## Areas and Levels

A role gives each of these areas one level:

| Area | Pages it covers |
|---|---|
| **Tracing Policy** | Tracing Policy, Templates, Behavior Discovery |
| **Network Policy** | Network Policy, Network Topology |
| **Admission Policy** | Admission Policy, Bindings |
| **Quarantine** | Quarantine and release of pods |
| **Events** | Security Events, Admission Events, Event Sources |
| **Vulnerabilities** | Workloads, Registries |
| **Notifications** | Alerts, Syslog |
| **System** | Users, Roles, Audit Log, Event Retention, Session Timeout |

| Level | Meaning |
|---|---|
| **None** | The area's pages are not shown and the API refuses its data |
| **View** | Read only |
| **Manage** | Create, change and delete. Manage includes View |

A page the role does not grant is not merely hidden: it is absent from the sidebar, opening its URL goes back to the Dashboard, and the API refuses the read (`this account's role does not allow this`). The cards on the Dashboard likewise show only what the role can view.

---

## Built-in Roles

| Role | Permissions |
|---|---|
| **Admin** | Manage on every area |
| **Viewer** | View on every area except Notifications and System |

Built-in roles cannot be edited or deleted. The list marks them **Built-in** and offers **View** only.

:::note[A Viewer cannot read notifications or settings]
No page ever showed Alerts, Syslog or Settings to a Viewer. Since v0.82.0 the API refuses them too (`GET /api/alerts`, `GET /api/rsyslog`, `GET /api/settings/session-ttl`), because the URL of a notification target is itself a credential.
:::

---

## Creating a Role

Under **Settings → Roles**, click **+ New Role**, enter a name, choose a level for each area and click **Create**.

![New Role form](/img/features/roles/new-role.png)

| Item | Description |
|---|---|
| **Name** | 1 to 40 letters, digits, spaces, `-` or `_`. Names are compared without regard to case and must not match an existing role (`admin` and `viewer` included). **It cannot be changed afterwards**, because accounts refer to a role by name |
| **Level per area** | Every area starts at None |

:::warning[Manage on System amounts to every permission]
Managing System includes giving any account any role, the holders of this role included. The form says so when Manage is chosen for System.
:::

---

## Editing and Deleting a Role

- **Edit** in the list changes what a role grants. The change takes effect **at once**, in sessions already open too, with no need to sign in again
- A role some account still has **cannot be deleted**: the message is `1 account has this role. Give them another role first.` Give those accounts another role first. The **Accounts** column shows how many accounts each role has
- A role that no longer exists grants nothing to an account that still refers to it

---

## Giving an Account a Role

- **When creating the account**: choose it in the **Role** select of the New User form
- **For an existing account**: click **Access** on the account's row, choose the role under **Role** and click **Save**. It takes effect at once

See [User Management](./users.md).

:::caution[One full Admin always remains]
The last account with the Admin role and the whole cluster cannot be deleted, given another role or limited to namespaces.
:::

---

## Roles and the Namespace Limit

The limit described in [Limiting an Account to Namespaces](./namespace-access.md) is unchanged and applies **on top of the role**: inside its namespaces, a limited account creates and edits what its role manages and reads what its role views.

Notifications and System belong to the cluster and stay out of reach of a limited account whatever its role.

---

## Storage and Upgrading

- Upgrading to v0.82.0 needs no data migration and no manifest to be re-applied
- Roles made here are kept in `roles.json` in the data directory. Like the other settings, they need [Persistent Storage](../installation/persistent-storage.md) to survive a pod restart
- Creating, editing and deleting roles, and changing an account's role, need Manage on System
