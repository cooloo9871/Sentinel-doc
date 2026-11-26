---
id: users
title: User Management
sidebar_position: 13
---

# User Management

## About This Feature

The User Management page provides administration for K8s Sentinel dashboard local accounts, including creating users, changing passwords, and configuring session timeout. K8s Sentinel uses JWT (JSON Web Token) for authentication, and all account data is stored in the local database.

---

## Viewing the User List

Navigate to **"Settings → Users"** to see all current user accounts.

![User list](/img/v0.81/features/users/list.png)

**Column descriptions:**

| Column | Description |
|---|---|
| **Username** | The login account name |
| **Role** | User role (`Admin` or `Viewer`) |
| **Namespace badges** | The namespaces an account is limited to, when it is |
| **Created date** | When the account was created |
| **Change Password** | Button to update the account's login password |
| **Access** | Sets whether the account reaches the whole cluster or selected namespaces, see [Limiting an Account to Namespaces](./namespace-access.md) |
| **Delete** | Deletes the account |

---

## Changing a Password

Click "**Change Password**" on an account row to open the dialog:

![Change Password dialog](/img/features/users/change-password.png)

Password security rules:

- **New passwords must be at least 8 characters** (enforced server-side)
- **Changing your own password requires the current password**, so a hijacked session cannot silently lock the owner out (one exception: the forced first-login change screen skips it)
- An admin **resetting another account's** password is a separate action that does not need the old one, but is audited all the same. It takes an **Admin of the whole cluster**; an Admin limited to namespaces cannot
- Every password change, including an attempt rejected for a wrong current password, is recorded in the [Audit Log](./audit-log.md)

Also note: the first sign-in with the default `admin` / `admin` **forces a password change** - see [Sign In to K8s Sentinel](../login.md).

---

## Creating a New User

Click **"+ New User"** in the top-right corner to open the new-user page (every editor has its own URL - bookmarkable, and F5 stays on the editor).

![New user form](/img/v0.81/features/users/new-user.png)

**Form fields:**

| Field | Required | Description |
|---|---|---|
| **Username** | ✅ | Login account name - cannot be changed after creation |
| **Password** | ✅ | Initial password - recommend the user change it after first login |
| **Role** | ✅ | Select `Admin` (full access) or `Viewer` (read-only) |
| **Access** | - | `Whole cluster` (default) or `Selected namespaces`. With the latter, tick the namespaces the account may reach, see [Limiting an Account to Namespaces](./namespace-access.md) |

Click **"Create"** to create the account.

---

## Role Descriptions

| Role | Description |
|---|---|
| **admin** | Full system access - can create, modify, and delete all policies, manage users, and change system settings |
| **viewer** | Read-only access - can browse policies, events and vulnerabilities but cannot add, modify, or delete anything, and does not see Alerts, Syslog or Settings |

Either role can further be limited to selected namespaces; the role still applies inside them. See [Limiting an Account to Namespaces](./namespace-access.md).

---

## Session Timeout

The **Session Timeout** section at the bottom of the page lets you configure how long a JWT token remains valid (in seconds).

| Setting | Description |
|---|---|
| **Timeout (seconds)** | JWT token lifetime - default is `3600` (1 hour) |

Click **"Save"** to apply the new value.

:::warning
Session Timeout changes take effect on the **next login**. Active sessions are not affected - users must log out and back in for the new timeout to apply.

When an account is **deleted** or its **password changes**, its existing sessions end immediately and return to the sign-in page; the role is also read from the account as it is now, not from the role recorded in the token.
:::
