---
id: yaml-editor
title: YAML Editor
sidebar_position: 4
---

# YAML Editor

## About This Feature

Sentinel provides two YAML operation modes for different use cases:

- **(a) Direct YAML Editing**: When creating or editing a Policy, switch to the "YAML" tab to write or paste a complete TracingPolicy YAML directly in a full-screen editor
- **(b) YAML Preview**: In the "Form" tab, a right-side panel updates in real time as form fields change, letting you confirm the generated YAML structure at any moment

---

## YAML Editor (Direct Editing)

Click the **"YAML"** tab at the top of the editor to open the full-screen dark YAML code editor.

![YAML tab (editor open)](/img/features/yaml-editor/open.png)

**How to use:**

- Type or modify TracingPolicy YAML content directly in the editor
- Supports copying and pasting a complete YAML definition from an external source
- The editor provides syntax highlighting for easier identification of YAML structure

**How it works:** The Sentinel backend validates the YAML against the `cilium.io/v1alpha1` schema upon receipt, confirming field formats and required fields are correct, before creating or updating the TracingPolicy resource via the Kubernetes API Server. If the YAML is invalid, the page displays an error message indicating the issue.

---

## Applying YAML

After editing, click the **"Save Changes"** button at the bottom of the page to save and apply the configuration.

Sentinel immediately submits the YAML to the backend for validation and application. On success, the page shows a confirmation message and you can see the updated status in the TracingPolicy list. If the apply fails (e.g., the Kubernetes API returns an error), the page displays the detailed error reason.

---

## YAML Preview (Live Preview)

Switch back to the **"Form"** tab to see the **YAML Preview** panel on the right side (dark background). If no Policy Name has been entered yet, the panel shows a "Enter a policy name to preview..." placeholder; once a name is entered, the panel immediately generates a live YAML preview based on the current form state.

**Details:**

- Whenever you add or modify a rule (Pod Selector, Process Rules, File Rules, Network Rules), the YAML Preview panel immediately reflects the latest TracingPolicy YAML structure
- The YAML Preview is generated entirely by frontend JavaScript in real time — no backend communication required
