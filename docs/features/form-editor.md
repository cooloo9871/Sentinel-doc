---
id: form-editor
title: 表單編輯器
sidebar_position: 3
---

# 表單編輯器

## 功能說明

表單編輯器提供圖形化的視覺介面，讓使用者不需要手寫 YAML 即可設定三種類型的安全規則：Process Rules（行程規則）、File Rules（檔案規則）與 Network Rules（網路規則）。每項規則皆支援白名單（Whitelist）與黑名單（Blacklist）兩種模式，可彈性因應不同的安全需求。

---

## Form / YAML 標籤切換

建立或編輯 TracingPolicy 時，編輯器頂部提供兩個標籤頁供切換。

![Form / YAML 標籤切換](/img/features/form-editor/tabs.png)

- 點擊「**Form**」標籤：進入圖形化表單介面，以結構化欄位填寫安全規則
- 點擊「**YAML**」標籤：切換至 YAML 原始碼編輯器，直接編寫或貼上完整的 TracingPolicy YAML

兩個標籤之間的內容會保持同步，切換時不會遺失已填寫的設定。

---

## Process Rules（行程規則）

Process Rules 用於控制 Pod 內可以執行的程式（process/binary）。

![Process Rules 區段](/img/features/form-editor/process-rule.png)

**Mode 選項說明：**

| Mode | 類型 | 說明 |
|---|---|---|
| **NotPostfix（Whitelist）** | 白名單 | 僅允許列表中指定的執行檔路徑；列表以外的所有程式皆被拒絕執行 |
| **Postfix（Blacklist）** | 黑名單 | 封鎖列表中指定的執行檔路徑；列表以外的程式皆可正常執行 |

**操作步驟：**

1. 在 Process Rules 區段選擇 Mode（建議初次使用 Blacklist 模式觀察行為）
2. 點擊「**+ Add**」按鈕新增執行檔路徑，例如 `/bin/bash`、`/usr/bin/curl`
3. 可新增多筆路徑，每筆路徑獨立一行

**執行原理：** Tetragon 在 Kernel 層透過掛載 `sys_execve` kprobe 攔截所有執行呼叫（exec syscall）。當 Pod 內的程式嘗試執行時，Tetragon 會比對 TracingPolicy 中的規則，決定是否允許或阻擋該執行請求。

---

## File Rules（檔案規則）

File Rules 用於控制 Pod 對檔案系統的讀寫存取行為。

![File Rules 區段](/img/features/form-editor/file-rule.png)

**Mode 選項說明：**

| Mode | 類型 | 說明 |
|---|---|---|
| **Blacklist** | 黑名單 | 封鎖列表中指定的檔案路徑；Pod 對這些路徑的讀取或寫入操作將被拒絕 |

**操作步驟：**

1. 在 File Rules 區段點擊「**+ Add**」按鈕
2. 填入要封鎖的檔案或目錄路徑，例如 `/etc/passwd`、`/etc/shadow`、`/root/.ssh/`
3. 可針對每條規則個別設定要攔截的操作類型（Read / Write）

**執行原理：** Tetragon 透過掛載 `sys_read` 與 `sys_write` kprobe 監控所有檔案 I/O 操作。當偵測到 Pod 存取被封鎖路徑時，依 Policy 模式決定僅記錄事件或直接阻擋操作。

---

## Network Rules（網路規則）

Network Rules 用於控制 Pod 對外發起的網路連線（Egress）。

![Network Rules 區段](/img/features/form-editor/network-rule.png)

**Mode 選項說明：**

| Mode | 類型 | 說明 |
|---|---|---|
| **NotDAddr（Whitelist）** | 白名單 | 僅允許連線至列表中指定的 IP 位址與 Port；列表以外的連線目標皆被封鎖 |
| **DAddr（Blacklist）** | 黑名單 | 封鎖連線至列表中指定的 IP 位址與 Port；列表以外的連線目標皆可正常連線 |

**操作步驟：**

1. 在 Network Rules 區段選擇 Mode
2. 點擊「**+ Add**」按鈕新增規則
3. 填入目標 IP 位址（例如 `203.0.113.10`）；Port 為選填欄位，若留空則比對所有 Port
4. 可新增多筆 IP/Port 組合

**執行原理：** Tetragon 透過掛載 `tcp_connect` kprobe 監控所有 TCP 連線發起事件。當 Pod 嘗試建立對外連線時，Tetragon 會比對目標 IP 與 Port 是否符合 Policy 規則，並依模式決定是否阻擋。
