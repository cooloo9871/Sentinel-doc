---
id: yaml-editor
title: YAML Editor
sidebar_position: 4
---

# YAML Editor

## About This Feature

Sentinel provides two YAML operation modes for different use cases:

- **(a) Direct YAML Editing**: When creating or editing a Policy, switch to the "YAML" tab to write or paste a complete TracingPolicy YAML directly in the editor
- **(b) YAML Preview**: In the "Form" tab, the preview area below the form updates in real time as fields change, making it easy to learn YAML syntax and verify rule configuration

---

## YAML Editor (Direct Editing)

Click the **"YAML"** tab at the top of the editor to expand the full YAML code editor.

![YAML tab (editor open)](/img/features/yaml-editor/open.png)

**How to use:**

- Type or modify TracingPolicy YAML content directly in the editor
- Supports copying and pasting a complete YAML definition from an external source
- The editor provides basic syntax highlighting for easier identification of YAML structure

**How it works:** The Sentinel backend validates the YAML against the `cilium.io/v1alpha1` schema upon receipt, confirming field formats and required fields are correct, before creating or updating the TracingPolicy resource via the Kubernetes API Server. If the YAML is invalid, the page displays an error message indicating the issue.

---

## Applying YAML

After editing, click the **"Save Changes"** button at the bottom of the page to save and apply the configuration.

![Save Changes button](/img/features/yaml-editor/apply.png)

Sentinel immediately submits the YAML to the backend for validation and application. On success, the page shows a confirmation message and you can see the updated status in the TracingPolicy list. If the apply fails (e.g., the Kubernetes API returns an error), the page displays the detailed error reason.

---

## YAML Preview (Live Preview)

Below the **"Form"** tab, Sentinel provides a YAML Preview area that updates in real time with any form field changes.

![YAML Preview area](/img/features/yaml-editor/preview.png)

**Details:**

- Whenever you add or modify a rule (Process Rules, File Rules, Network Rules) in the form, the YAML Preview area immediately reflects the latest TracingPolicy YAML structure
- **"✓ valid"** shown in the top-right corner of the preview means the current YAML format is correct and safe to save
- If a format error occurs, the preview area displays a red warning indicating the specific problematic field

**How it works:** The YAML Preview is generated entirely by frontend JavaScript in real time, assembling a TracingPolicy YAML data structure compliant with the `cilium.io/v1alpha1` spec from the current form field values and displaying it in the preview area in formatted form — no backend communication required.
