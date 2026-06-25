---
id: users
title: User Management
sidebar_position: 13
---

# User Management

## About This Feature

The User Management page provides administration for Sentinel dashboard local accounts, including creating users, changing passwords, and configuring session timeout. Sentinel uses JWT (JSON Web Token) for authentication, and all account data is stored in the local database.

---

## Viewing the User List

Navigate to **"Settings → Users"** to see all current user accounts.

![User list](/img/features/users/list.png)

**Column descriptions:**

| Column | Description |
|---|---|
| **Username** | The login account name |
| **Role** | User role (`admin` or `viewer`) |
| **Created date** | When the account was created |
| **Change Password** | Button to update the account's login password |

---

## Creating a New User

Click **"+ New User"** in the top-right corner to expand the new user form.

![New user form](/img/features/users/new-user.png)

**Form fields:**

| Field | Required | Description |
|---|---|---|
| **Username** | ✅ | Login account name — cannot be changed after creation |
| **Password** | ✅ | Initial password — recommend the user change it after first login |
| **Role** | ✅ | Select `admin` (full access) or `viewer` (read-only) |

Click **"Save"** to create the account.

---

## Role Descriptions

| Role | Description |
|---|---|
| **admin** | Full system access — can create, modify, and delete all policies, manage users, and change system settings |
| **viewer** | Read-only access — can browse all pages and data but cannot add, modify, or delete anything |

---

## Session Timeout

The **Session Timeout** section at the bottom of the page lets you configure how long a JWT token remains valid (in seconds).

| Setting | Description |
|---|---|
| **Timeout (seconds)** | JWT token lifetime — default is `3600` (1 hour) |

Click **"Save"** to apply the new value.

:::warning
Session Timeout changes take effect on the **next login**. Active sessions are not affected — users must log out and back in for the new timeout to apply.
:::
