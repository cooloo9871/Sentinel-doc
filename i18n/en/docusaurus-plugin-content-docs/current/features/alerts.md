---
id: alerts
title: Alerts
sidebar_position: 14
---

# Alerts

## About This Feature

The Alerts page lets you configure **webhook alert rules** that trigger when Security Events or Admission Events match specified conditions. Sentinel sends an HTTP POST to the configured webhook URL, supporting Slack, Microsoft Teams, Discord, and any compatible webhook service.

---

## Viewing Alert Rules

Navigate to **"Settings → Alerts"** to see all configured alert rules.

![Alerts page](/img/features/alerts/overview.png)

---

## Creating a New Alert Rule

Click **"+ New Rule"** in the top-right corner to expand the rule creation form.

![New alert rule form](/img/features/alerts/new-rule.png)

**Form fields:**

| Field | Required | Description |
|---|---|---|
| **Name** | ✅ | Display name for this alert rule |
| **Cooldown (minutes)** | ✅ | Minimum interval between triggers for this rule — prevents alert storms; default is 5 minutes |
| **Webhook URL** | ✅ | The webhook endpoint to POST to (e.g., a Slack Incoming Webhook URL) |
| **Event Type** | — | Check which event sources to monitor: `Security Events`, `Admission Events`, or both |
| **Severity** | — | Check which severity levels to trigger on: `warning`, `critical`, or both |
| **Namespaces** | — | Comma-separated Namespace names to watch; leave empty to watch all Namespaces |
| **Policies** | — | Comma-separated Policy names to watch; leave empty to watch all Policies |

Click **"Save"** to activate the rule.

---

## How Alerting Works

When a new security event arrives and matches a rule's conditions, the backend:

1. Checks whether the event's Namespace, Policy name, and severity match the rule
2. Verifies the rule is not within its cooldown period
3. Constructs an alert payload and sends it via HTTP POST to the webhook URL

---

## Supported Platforms

| Platform | Notes |
|---|---|
| **Slack** | Use a Slack Incoming Webhook URL |
| **Microsoft Teams** | Use a Teams Incoming Webhook Connector URL |
| **Discord** | Use a Discord Webhook URL |
| **Custom HTTP endpoint** | Any service that can receive an HTTP POST with a JSON payload |

:::tip
Consider setting up separate rules for different severity levels — route `critical` alerts to a high-priority channel and `warning` alerts to a general monitoring channel to help triage incidents faster.
:::
