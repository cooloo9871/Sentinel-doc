---
id: ingress
title: Ingress Access
sidebar_position: 2
---

## When to Use

Production environments and multi-user shared access requiring a fixed URL. Ingress allows team members to open the Sentinel management UI directly in a browser without running `kubectl`.

## Prerequisites

The cluster must have an Ingress Controller installed. Common options include:

- **nginx-ingress** (`ingress-nginx`)
- **Traefik**

Confirm the Ingress Controller is running and has obtained an external IP before proceeding.

## Create the Ingress Resource

Create a YAML file, e.g., `sentinel-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sentinel-ingress
  namespace: sentinel-system
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: sentinel.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sentinel-svc
                port:
                  number: 8080
```

**Why:** Ingress is a Kubernetes L7 routing resource. The Ingress Controller continuously watches Ingress object changes and automatically configures reverse proxy rules to route external HTTP/HTTPS requests to the specified Service.

## Apply the Configuration

Apply the YAML to the cluster and check resource status:

```bash
kubectl apply -f sentinel-ingress.yaml
kubectl get ingress -n sentinel-system
```

After a successful apply, `kubectl get ingress` should show `sentinel-ingress` with the corresponding host and Address.

## Configure DNS or hosts

Point `sentinel.example.com` to the Ingress Controller's External IP:

```bash
# Check the Ingress Controller's External IP
kubectl get svc -n ingress-nginx

# For local testing with /etc/hosts (replace with actual IP)
echo "192.168.x.x sentinel.example.com" | sudo tee -a /etc/hosts
```

For production, add an A Record in your DNS provider's control panel pointing `sentinel.example.com` to the Ingress Controller's External IP.

:::info
For production environments, pair this with **cert-manager** to configure TLS, automatically requesting and renewing Let's Encrypt certificates for HTTPS. See the [cert-manager documentation](https://cert-manager.io/docs/) for setup instructions.
:::
