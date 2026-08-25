---
id: audit-log
title: Audit Log
sidebar_position: 19
---

# Audit Log

## Overview

The Audit Log (v0.45+) records **every operation performed through K8s Sentinel**, answering who did what, when, and to which target: quarantine and release, Global Protect Mode, create/update/delete across all three policy types, user management, alert and syslog config, retention changes, plus every sign-in attempt and password change.

Open "**Notifications → Audit Log**" to view it (moved from Settings to the Notifications menu in v0.50.2; admin role only, and the menu item is hidden from viewers):

![Audit Log page](/img/features/audit/list.png)

---

## Columns

| Column | Description |
|---|---|
| **Time** | When the operation happened |
| **User** | The signed-in account that performed it; for sign-in attempts, **the account the attempt was aimed at** (including non-existent usernames someone tried) |
| **Action** | A readable action name, e.g. `Quarantine pod`, `Delete network policy`, `Sign in`, `Change user password` |
| **Target** | The pod, policy or user acted on (from the URL or the request body's `metadata.name`); sign-in attempts record the **source IP** |
| **Status** | The outcome in words: `Success` / `Rejected` / `Denied` / `Not found` / `Conflict` / `Rate limited` / `Error`, with the raw HTTP code on hover |

**Rejected attempts are recorded too**, not just successes: a password change with the wrong current password (403), a login with wrong credentials (401), and a rate-limited login (429) all leave a record.

---

## Filtering and Export

- **Filter**: the "Filter by user, action or target..." box narrows the list live
- **Export CSV** (v0.46+): writes out **what is on screen** (Time, User, Action, Target, Status, Method, Path), so an active filter narrows the file too. The CSV carries a UTF-8 BOM, so Excel opens it correctly

---

## How It Works, and Limits

- Recorded by middleware on the admin route group, so a new write route is covered **automatically** without a per-handler call; the two special routes outside that group (login and password change) carry their own audit hooks
- **Writes only**: reads (GET) are not recorded, and reading the log does not append to it
- **Append-only and persisted**, capped at **5,000 entries** (oldest evicted), so it cannot be trivially flooded to push out evidence; rate-limited (429) logins are not audited, so a flood cannot evict real admin-action records
- Passwords are never recorded

:::tip
The Audit Log is **not** forwarded to Syslog or Alerts ([Syslog](./syslog.md) carries Security Events and Admission Events). The 5,000-entry cap is a rolling window with the oldest entries evicted, so for long-term retention export regularly with **Export CSV**.
:::
