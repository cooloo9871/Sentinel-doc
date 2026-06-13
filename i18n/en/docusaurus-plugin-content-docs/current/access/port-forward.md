---
id: port-forward
title: Port-Forward Access
sidebar_position: 1
---

## When to Use

Local development, quick testing — no need to configure Ingress or a LoadBalancer. Ideal for developers to connect directly to the Sentinel service inside the cluster from their local machine.

## Step 1: Run Port-Forward

Map the in-cluster Service to a local port:

```bash
kubectl port-forward -n sentinel-system svc/sentinel-svc 8080:8080
```

**Why:** `kubectl port-forward` creates a tunnel on your local machine that forwards packets through the Kubernetes API Server to the Pod. The command occupies the terminal for the duration of the connection — close the terminal or press `Ctrl+C` to disconnect.

## Step 2: Open in Browser

Enter the following in your browser:

```
http://localhost:8080
```

Default credentials:

| Field | Default Value |
|------|--------|
| Username | `admin` |
| Password | `admin` |

> Change the password immediately after your first login to avoid security risks.

## Step 3: Confirm the Login Screen

![Login screen](/img/access/login.png)

Enter your Username and Password, then click **Sign in** to complete login.

**Why:** Sentinel uses JWT (JSON Web Token) for authentication. After a successful login, the token is stored in the browser's `localStorage` and automatically included in the Authorization header for all subsequent requests.

## Running in Background

:::tip
To avoid occupying a terminal, run port-forward in the background with `&`:

```bash
kubectl port-forward -n sentinel-system svc/sentinel-svc 8080:8080 &
```

To stop the background port-forward, bring it to the foreground with `fg` then press `Ctrl+C`, or terminate it with `kill %1`.
:::

:::warning
`port-forward` is only suitable for single-user local access, not for multi-user shared or production environments. For production, use [Ingress access](./ingress.md) instead.
:::
