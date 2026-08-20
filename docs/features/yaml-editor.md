---
id: yaml-editor
title: YAML 編輯器
sidebar_position: 4
---

# YAML 編輯器

## 功能說明

除了圖形化表單外，K8s Sentinel 提供兩種與 YAML 相關的操作方式，適合不同使用情境：

- **(a) 直接 YAML 編輯**：點擊 Tracing Policy 列表頁的「**+ New YAML**」，在全螢幕編輯器中直接撰寫或貼上完整的 TracingPolicy YAML
- **(b) Generated YAML 即時預覽**：在表單編輯器右側面板，隨表單欄位變更即時顯示對應的 YAML 結構，方便確認規則設定正確

---

## YAML 編輯器（直接編輯）

點擊列表頁的「**+ New YAML**」後，進入全螢幕的深色 YAML 程式碼編輯器。

![YAML 編輯器](/img/features/yaml-editor/open.png)

**使用方式：**

- 可直接在編輯器中輸入或修改 TracingPolicy YAML 內容，支援從外部來源複製貼上完整定義
- 編輯器提供語法高亮與行號顯示，方便辨識 YAML 結構層次
- 頁面右上角的 **Mode** 下拉選單設定此 Policy 的執行模式（`Monitoring` / `Protect`）
- 完成後點擊「**Apply**」套用

**執行原理：** K8s Sentinel 後端接收 YAML 後，會先針對 `cilium.io/v1alpha1` Schema 進行結構驗證，確認欄位格式與必要欄位皆正確無誤，驗證通過後才透過 Kubernetes API Server 建立或更新 TracingPolicy 資源。若 YAML 格式有誤，頁面會顯示錯誤訊息指出問題所在。

---

## Generated YAML（即時預覽）

使用表單編輯器（「**+ New Policy**」或「**Edit**」）時，頁面右側固定顯示 **Generated YAML** 面板（深色背景），並在右上角標示產生的資源類型（`TracingPolicy` 或 `TracingPolicyNamespaced`）。

**說明：**

- 每當您在表單中新增或修改規則（Pod Selector、Process Rules、File Rules），Generated YAML 面板會立即反映最新的 TracingPolicy YAML 結構
- 預覽完全由前端即時運算產生，無需與後端通訊
- 點擊「**Apply**」時，實際送出的內容即為此面板顯示的 YAML
