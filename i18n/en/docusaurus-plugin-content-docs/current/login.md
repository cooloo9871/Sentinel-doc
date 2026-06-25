---
id: login
title: Sign In to Sentinel
sidebar_position: 5
---

# Sign In to Sentinel

After completing the installation and obtaining the access URL, open the Sentinel management UI in your browser — you will be greeted by the login screen.

## Login Screen

![Sentinel login screen](/img/access/login.png)

## Default Credentials

Use the following default account for first-time login:

| Field | Default Value |
|-------|---------------|
| **Username** | `admin` |
| **Password** | `admin` |

Enter the credentials and click the **Sign in** button to log in.

:::warning
After your first login, immediately go to **Settings → Users** to change the default password and prevent unauthorized access.
:::

## How Authentication Works

Sentinel uses **JWT (JSON Web Token)** for authentication. After a successful login, the token is stored in the browser's `localStorage` and automatically included in the `Authorization` header of every subsequent API request. Once the token expires (default Session Timeout is 3600 seconds), you will be logged out automatically and must sign in again.
