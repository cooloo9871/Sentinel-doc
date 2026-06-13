---
id: templates
title: Policy Templates
sidebar_position: 7
---

# Policy Templates

## 功能說明

Policy Templates 是預先定義好的 TracingPolicy 範本庫，包含內建的常用安全策略範本，以及使用者自行建立的自訂範本。透過 Templates，您可以一鍵套用經過驗證的策略定義，快速部署安全監控規則，無需從零撰寫 YAML。

---

## 查看模板清單

進入「**Templates**」頁面後，所有可用的範本會以卡片形式排列顯示。

![Templates 列表頁](/img/features/templates/list.png)

每張模板卡片包含以下資訊：

| 元素 | 說明 |
|---|---|
| **模板名稱** | 範本的顯示名稱，簡述其用途 |
| **Tags** | 以標籤分類範本的適用場景（例如 `cluster-wide`、`process`、`monitoring`） |
| **Description** | 簡要說明此範本的功能與適用情境 |
| **YAML 預覽** | 顯示範本 YAML 的前幾行，方便快速確認內容 |
| **Use Template** | 以此範本為基礎，立即建立一條新的 TracingPolicy |
| **View YAML** | 查看此範本的完整 YAML 定義 |

---

## 使用模板建立 Policy

點擊模板卡片上的「**Use Template**」按鈕，會彈出確認對話框。

![Use Template 對話框](/img/features/templates/use-dialog.png)

**操作步驟：**

1. 系統自動產生一個 Policy Name（格式為 `<模板名稱>-<隨機後綴>`）
2. 可自行修改 Policy Name，需符合 Kubernetes 命名規範（小寫英文、數字與連字號）
3. 點擊「**Create**」即完成建立

**執行原理：** Sentinel 以範本的 YAML 結構為基礎，將 `metadata.name` 替換為您輸入的 Policy Name，並透過 Kubernetes API Server 在叢集中建立對應的 TracingPolicy 資源。建立完成後可在 TracingPolicy 列表頁查看新建立的 Policy。

---

## 檢視模板 YAML

點擊模板卡片下方的「**View YAML**」連結，進入完整 YAML 檢視頁面。

![View YAML 頁面](/img/features/templates/view-yaml.png)

此頁面以語法高亮方式呈現完整的 TracingPolicy YAML 定義，方便您了解範本的完整設定內容，或作為自行撰寫 YAML 的參考。點擊「**← Back**」返回範本列表。

---

## 建立自訂範本

點擊頁面右上角的「**+ New Template**」按鈕，展開自訂範本建立表單。

![新增自訂範本表單](/img/features/templates/new-form.png)

**表單欄位說明：**

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Name** | ✅ | 範本的顯示名稱，建議使用有意義的描述性名稱 |
| **Tags** | — | 以逗號分隔的標籤，用於分類與快速識別（例如 `namespace, process`） |
| **Description** | — | 說明此範本的用途，幫助團隊成員了解適用場景 |
| **YAML** | ✅ | 完整的 TracingPolicy YAML 定義，需符合 `cilium.io/v1alpha1` Schema |

填寫完成後點擊「**Save Template**」儲存。自訂範本建立後會出現在範本列表中，供後續重複使用。

:::tip
建立自訂範本前，建議先在 TracingPolicy 頁面以表單編輯器或 YAML 編輯器設計並測試好策略，確認規則正確後再轉存為範本，以確保範本 YAML 的正確性。
:::
