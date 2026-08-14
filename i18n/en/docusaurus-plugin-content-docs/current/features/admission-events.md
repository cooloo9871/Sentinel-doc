---
id: admission-events
title: Admission Events
sidebar_position: 12
---

# Admission Events

## About This Feature

The Admission Events page records and displays violation events from Kubernetes **ValidatingAdmissionPolicy**. When a resource operation (create or update) violates an applied Admission Policy, the API Server emits a Warning event. Sentinel receives and stores these events via a webhook endpoint, making them available for real-time review and audit.

---

## Viewing Admission Events

Navigate to **"Admission Events"** to see the list of captured admission violation events.

![Admission Events page](/img/features/admission-events/list.png)

**Page elements:**

| Element | Description |
|---|---|
| **Event counters** | Summary banner showing total events, Warning count, and Critical count |
| **Search box** | Filter by resource name or policy name keyword |
| **Namespace dropdown** | Filter events by a specific Namespace |
| **Event type dropdown** | Show all events or a specific event type |
| **Source dropdown** | Toggle between event sources (Audit Log) |

---

## Event Severity

| Severity | Description |
|---|---|
| **Warning** | Resource violated an Admission Policy rule but was still admitted because `failurePolicy: Warn` was set |
| **Critical** | Resource was rejected by the API Server due to an Admission Policy violation (`failurePolicy: Fail`) |

---

## Configuring Kubernetes Audit Log

Admission Events are sourced from the Kubernetes Audit Webhook, which requires configuring the kube-apiserver's Audit Policy and Webhook on every control plane node. See [Wiring Up the API Server Audit Log](../installation/audit-webhook.md) in the Installation section for the full setup.

If this page stays empty, the audit webhook is most likely not configured yet or misconfigured.

---

:::info
Admission Events retention settings (max event count and TTL) can be configured in **Settings → Event Retention** under the "Admission Events" tab.
:::
