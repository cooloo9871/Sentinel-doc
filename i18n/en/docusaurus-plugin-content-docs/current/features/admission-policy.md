---
id: admission-policy
title: Admission Policy
sidebar_position: 11
---

# Admission Policy

## About This Feature

Admission Policy provides a visual builder for Kubernetes **ValidatingAdmissionPolicy (VAP)**. Users can create resource admission rules through a graphical form without writing CEL expressions by hand. All policies created via Sentinel are applied directly to the Kubernetes API Server, which validates resources in real time when they are created or updated.

---

## Page Structure

The Admission Policy page has two tabs:

- **Policies** — lists all `ValidatingAdmissionPolicy` resources in the cluster
- **Bindings** — lists all `ValidatingAdmissionPolicyBinding` resources that associate Policies with specific Namespaces or resources

![Admission Policy list](/img/features/admission-policy/list.png)

---

## Creating a New Policy

Click **"+ New Policy"** in the top-right corner to open the visual builder.

![Create Admission Policy form](/img/features/admission-policy/new-form.png)

### Supported Rule Types

Sentinel provides seven built-in rule types covering the most common Kubernetes admission validation needs:

| Rule Type | Description |
|---|---|
| **Label Check** | Require or deny resources with a specific label key=value |
| **Annotation Check** | Require or deny resources with a specific annotation |
| **Image Policy** | Control which container image registries or image names are allowed |
| **Replica Limit** | Enforce a maximum or minimum replica count on Deployments / StatefulSets |
| **Resource Limits** | Require containers to define CPU / Memory requests and limits |
| **Security Context** | Enforce or deny specific Pod Security Context settings (e.g., forbid `runAsRoot`) |
| **Host Access** | Restrict Pod usage of hostPID, hostNetwork, hostIPC, and similar host-sharing options |

### Form Fields

| Field | Description |
|---|---|
| **Policy Name** | The `ValidatingAdmissionPolicy` resource name — must follow Kubernetes naming conventions |
| **Rule Type** | Select one of the seven rule types above |
| **Apply To** | Choose which resource types this policy applies to (Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob, or all) |
| **Rule details** | Fields specific to the selected rule type appear below |

### Live YAML Preview

The **Generated YAML** panel on the right shows the complete `ValidatingAdmissionPolicy` YAML generated from your form inputs in real time, so you can verify the CEL expressions and rule content at any point.

---

## Creating a Policy via YAML

For finer-grained control, click **"+ New YAML"** to paste a complete `ValidatingAdmissionPolicy` YAML definition directly.

---

## Managing Bindings

Switch to the **"Bindings"** tab to manage `ValidatingAdmissionPolicyBinding` resources.

![Bindings tab](/img/features/admission-policy/bindings.png)

A Binding associates an existing ValidatingAdmissionPolicy with specific Namespaces or resources and configures the action on violation (Deny / Warn / Audit).

**How it works:** Sentinel creates `ValidatingAdmissionPolicy` and `ValidatingAdmissionPolicyBinding` resources via the Kubernetes API Server. For each resource request matching `matchConstraints`, the API Server evaluates the CEL expression and, based on `failurePolicy`, either rejects or warns.

:::info
Admission Policy requires Kubernetes 1.26+ with the `ValidatingAdmissionPolicy` feature gate enabled (enabled by default in Kubernetes 1.28+).
:::
