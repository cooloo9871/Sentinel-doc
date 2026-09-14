---
id: admission-policy
title: Admission Policy
sidebar_position: 11
---

# Admission Policy

## About This Feature

Admission Policy provides a visual builder for Kubernetes **ValidatingAdmissionPolicy (VAP)**. Users can create resource admission rules through a graphical form without writing CEL expressions by hand. All policies created via K8s Sentinel are applied directly to the Kubernetes API Server, which validates resources in real time when they are created or updated.

---

## Page Structure

The Admission Policy page has two tabs:

- **Policies** - lists all `ValidatingAdmissionPolicy` resources in the cluster
- **Bindings** - lists all `ValidatingAdmissionPolicyBinding` resources that associate Policies with specific Namespaces or resources

![Admission Policy list](/img/features/admission-policy/list.png)

---

## Creating a New Policy

Click **"+ New Policy"** in the top-right corner to open the visual builder.

![Create Admission Policy form](/img/features/admission-policy/new-form.png)

### Supported Rule Types

K8s Sentinel provides nine built-in rule types (ConfigMap Size added in v0.55, Secret Size in v0.57) covering the most common Kubernetes admission validation needs:

| Rule Type | Description |
|---|---|
| **Label Check** | Require or forbid specific label key=value pairs; multiple rules supported |
| **Annotation Check** | Require or forbid specific annotation key=value pairs |
| **Image Policy** | Forbid the `:latest` tag and require images from named registries. Since v0.59 it covers **initContainers and ephemeral (debug) containers**, the registry prefix compares case-insensitively, and an untagged image with a registry port (`myreg:5000/app`) is correctly refused |
| **Replica Limit** | Cap replicas on Deployments / StatefulSets. Since v0.59 **`kubectl scale` and HPA via the scale subresource are capped too** |
| **Resource Limits** | Require CPU / Memory limits, covering every workload type and initContainers |
| **Security Context** | Forbid privileged containers and require runAsNonRoot (honouring pod- and container-level inheritance). Covers ephemeral (debug) containers since v0.59 |
| **Host Access** | Forbid hostNetwork, hostPID and hostIPC host-sharing options |
| **ConfigMap Size** (v0.55+) | Cap a ConfigMap's **total size** (KB; `data` plus `binaryData`, key names included). A new object must fit the cap; an existing oversized one may stay or shrink but **not grow** |
| **Secret Size** (v0.57+) | The same total-size cap for Secrets, with `data` measured base64-**decoded**; managed types (`kubernetes.io/service-account-token`, `bootstrap.kubernetes.io/token`, `helm.sh/release.v1`) are exempt |

### Form Fields

| Field | Description |
|---|---|
| **Policy Name** | The `ValidatingAdmissionPolicy` resource name - must follow Kubernetes naming conventions |
| **Rule Type** | Select one of the nine rule types above |
| **Apply To** | Choose which resource types this policy applies to (All Workloads, Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob, and since v0.59 Namespaces); workload rules also match ReplicationControllers |
| **Rule details** | Fields specific to the selected rule type appear below; a blank Violation Message uses a concrete default (previewed live as the field placeholder) |

:::note[Known coverage limits]
The size rules skip objects with more than 200 keys (a cost-budget guard, so a huge object can never become permanently unwritable under `failurePolicy: Fail`); the Security Context rule does not cover `capabilities`-based privilege; Host Access does not cover `hostPort`.
:::

### Live YAML Preview

The **Generated YAML** panel on the right shows the complete `ValidatingAdmissionPolicy` YAML generated from your form inputs in real time, so you can verify the CEL expressions and rule content at any point.

---

## Creating a Policy via YAML

For finer-grained control, click **"+ New YAML"** to paste a complete `ValidatingAdmissionPolicy` YAML definition directly.

:::note[How Edit opens]
A policy built with the form reopens in the **form** (defaults the kube-apiserver adds on persist, such as `matchPolicy: Equivalent`, don't affect this); a policy applied with `kubectl` or carrying explicit non-default settings the form cannot represent opens in the **YAML editor**, so a form save cannot erase them. Bindings behave the same way.
:::

---

## Managing Bindings

Switch to the **"Bindings"** tab to manage `ValidatingAdmissionPolicyBinding` resources.

![Bindings tab](/img/features/admission-policy/bindings.png)

A Binding associates an existing ValidatingAdmissionPolicy with a scope and configures the action on violation (Deny / Audit / Warn).

The **namespace scope** (v0.54+) offers three modes, all multi-selectable:

| Mode | Description |
|---|---|
| **All namespaces** | No filter, cluster-wide (the hint notes this includes `kube-system`) |
| **Only these namespaces** | Applies only in the selected namespaces (`matchExpressions` with `In`) |
| **All except these namespaces** | Applies everywhere but the selected ones (`NotIn`), e.g. the classic cluster-wide guardrail excluding `kube-system` / `kube-public` / `kube-node-lease` |

:::tip
Pair the ConfigMap / Secret Size rules with an "All except" binding that excludes `kube-system` and friends, so kubelet and controller writes are never blocked.
:::

**How it works:** K8s Sentinel creates `ValidatingAdmissionPolicy` and `ValidatingAdmissionPolicyBinding` resources via the Kubernetes API Server. For each resource request matching `matchConstraints`, the API Server evaluates the CEL expression and, based on `failurePolicy`, either rejects or warns.

:::info
Admission Policy requires Kubernetes 1.26+ with the `ValidatingAdmissionPolicy` feature gate enabled (enabled by default in Kubernetes 1.28+).
:::
