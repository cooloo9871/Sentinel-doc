---
id: execution-mode
title: 執行模式切換
sidebar_position: 5
---

# 執行模式切換

## 兩種執行模式說明

Sentinel 的每條 TracingPolicy 皆支援兩種執行模式，可依照部署階段與驗證進度彈性切換：

| 模式 | 說明 | 適用時機 |
|---|---|---|
| **Monitoring** | 僅記錄偵測到的事件，不阻擋任何行為。所有違規操作皆會產生安全事件紀錄，但 Pod 仍可正常執行 | 初期部署階段、觀察期、Policy 驗證階段 |
| **Protect** | 同時記錄事件並主動阻擋違規行為。違反 Policy 規則的 process 執行、檔案存取或網路連線將被 Tetragon 直接攔截拒絕 | 策略驗證完成、確認規則無誤後正式上線 |

---

## 單一 Policy 模式設定

每條 TracingPolicy 在建立時可個別設定其執行模式，彼此互相獨立，不受其他 Policy 影響。

**設定方式：**

1. 建立新 Policy 時，在「**Mode**」欄位選擇 `Monitoring` 或 `Protect`
2. 建立完成後，可隨時在 TracingPolicy 列表頁的 Actions 欄位點擊「**Edit**」進入編輯頁面修改模式
3. 修改完成後點擊「**Save Changes**」儲存，Tetragon Agent 會在數秒內套用新模式

---

## Global Protect Mode（全域切換）

除了逐一切換個別 Policy 的模式外，Sentinel 提供 **Global Protect Mode** 功能，可一鍵將叢集內所有 TracingPolicy 同時切換執行模式。

![Global Protect Mode 切換區](/img/features/mode/monitoring.png)

Global Protect Mode 的切換 banner 位於 TracingPolicy 頁面頂部，顯示目前全域模式的狀態。

### 步驟：開啟 Global Protect Mode

**操作：** 點擊 banner 上的「**Turn On**」按鈕

**執行原理：** Sentinel 後端收到請求後，會查詢叢集內所有 TracingPolicy 與 TracingPolicyNamespaced 資源，並批次將每一條 Policy 的 `mode` 欄位更新為 `Protect`。Tetragon Agent 監聽到 CRD 資源變更事件後，會立即重新載入規則並生效，無需重啟 Agent。

### 步驟：關閉 Global Protect Mode

**操作：** 再次點擊 banner 上的切換按鈕

**執行原理：** Sentinel 後端批次將叢集內所有 TracingPolicy 的 `mode` 欄位還原為 `Monitoring`，Tetragon Agent 收到更新後立即切回僅記錄模式，停止阻擋任何行為。

---

:::warning
開啟 Global Protect Mode 之前，請務必確認叢集內所有 TracingPolicy 的規則已經過充分驗證。若規則設定有誤（例如 Whitelist 遺漏了必要的執行檔路徑），切換至 Protect 模式後可能導致正常的業務流量或關鍵服務被阻擋，造成服務中斷。建議先在測試環境驗證，或逐條 Policy 切換模式，確認無誤後再啟用全域切換。
:::
