---
id: yaml-editor
title: YAML 編輯器
sidebar_position: 4
---

# YAML 編輯器

## 功能說明

Sentinel 提供兩種 YAML 操作方式，適合不同使用情境：

- **(a) 直接 YAML 編輯**：在建立或編輯 Policy 時切換至「YAML」標籤，直接在編輯器中撰寫或貼上完整的 TracingPolicy YAML
- **(b) YAML Preview 即時預覽**：在「Form」標籤下方的預覽區，隨著表單欄位的變更即時顯示對應的 YAML 結構，方便學習 YAML 語法與確認規則設定正確

---

## YAML 編輯器（直接編輯）

點擊編輯器頂部的「**YAML**」標籤後，完整的 YAML 程式碼編輯器會展開顯示。

![YAML 標籤頁（編輯器開啟）](/img/features/yaml-editor/open.png)

**使用方式：**

- 可直接在編輯器中輸入或修改 TracingPolicy YAML 內容
- 支援從外部來源複製貼上完整的 YAML 定義
- 編輯器提供基本的語法高亮功能，方便辨識 YAML 結構層次

**執行原理：** Sentinel 後端接收 YAML 後，會先針對 `cilium.io/v1alpha1` Schema 進行結構驗證，確認欄位格式與必要欄位皆正確無誤，驗證通過後才透過 Kubernetes API Server 建立或更新 TracingPolicy 資源。若 YAML 格式有誤，頁面會顯示錯誤訊息指出問題所在。

---

## 套用 YAML

完成 YAML 編輯後，點擊頁面底部的「**Save Changes**」按鈕儲存並套用設定。

![Save Changes 按鈕](/img/features/yaml-editor/apply.png)

Sentinel 會立即將 YAML 送出至後端進行驗證與套用。成功後頁面會顯示確認訊息，並可在 TracingPolicy 列表頁看到更新後的狀態。若套用失敗（例如 Kubernetes API 回傳錯誤），頁面會顯示詳細的錯誤原因。

---

## YAML Preview（即時預覽）

在「**Form**」標籤下方，Sentinel 提供 YAML Preview 預覽區，會隨著表單欄位的任何變更即時更新對應的 YAML 輸出。

![YAML Preview 預覽區](/img/features/yaml-editor/preview.png)

**說明：**

- 每當您在表單中新增或修改規則（Process Rules、File Rules、Network Rules），YAML Preview 區域會立即反映最新的 TracingPolicy YAML 結構
- 預覽區右上角顯示「**✓ valid**」代表目前的 YAML 格式正確，可安全儲存
- 若出現格式錯誤，預覽區會改以紅色警示提示具體的問題欄位

**執行原理：** YAML Preview 完全由前端 JavaScript 即時運算產生，根據表單欄位的當前值組裝出符合 `cilium.io/v1alpha1` 規範的 TracingPolicy YAML 資料結構，並以格式化的方式呈現在預覽區中，無需與後端通訊即可即時顯示結果。
