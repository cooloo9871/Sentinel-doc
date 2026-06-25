---
id: form-editor
title: 表單編輯器
sidebar_position: 3
---

# 表單編輯器

## 功能說明

表單編輯器提供圖形化的視覺介面，讓使用者不需要手寫 YAML 即可設定四個區段的安全規則：Pod Selector（目標 Pod 選擇）、Process Rules（行程規則）、File Rules（檔案規則）與 Network Rules（網路規則）。右側的 **YAML Preview** 面板會隨表單變更即時更新，方便確認規則設定。

---

## Form / YAML 標籤切換

建立或編輯 TracingPolicy 時，編輯器頂部提供兩個標籤頁供切換。

![Form / YAML 標籤切換](/img/features/form-editor/tabs.png)

- 點擊「**Form**」標籤：進入圖形化表單介面，右側顯示 YAML Preview 即時預覽
- 點擊「**YAML**」標籤：切換至全螢幕 YAML 原始碼編輯器，直接編寫或貼上完整的 TracingPolicy YAML

兩個標籤之間的內容保持同步，切換時不會遺失設定。

---

## 執行模式（Mode）

建立頁面右上角的 **Mode** 下拉選單用於設定此 Policy 的執行模式：

| Mode | 說明 |
|---|---|
| **Monitoring** | 僅記錄偵測到的事件，不阻擋任何行為 |
| **Protect** | 同時記錄事件並主動阻擋違規行為 |

此設定與表單內容獨立，可在任何時候切換。

---

## Pod Selector（目標選擇）

Pod Selector 區段允許您將此 TracingPolicy 的規則限縮到特定 Pod，而非套用至 Namespace 內所有 Pod。

**操作步驟：**

1. 點擊「**+ Add Label**」新增一組 key=value Label 篩選條件
2. 可新增多組 Label；所有條件之間為 AND 邏輯（Pod 必須同時符合所有 Label 才受此 Policy 管轄）
3. 若 Pod Selector 留空，則 Policy 套用至 Namespace 內全部 Pod（或 Cluster-scoped 時套用全叢集）

---

## Process Rules（行程規則）

Process Rules 用於控制 Pod 內可以執行的程式（process/binary）。

![Process Rules 區段](/img/features/form-editor/process-rule.png)

**Mode 選項說明：**

| Mode | 類型 | 說明 |
|---|---|---|
| **NotPostfix — Whitelist** | 白名單 | 僅允許列表中指定的執行檔路徑；列表以外的所有程式皆被拒絕執行 |
| **Postfix — Blacklist** | 黑名單 | 封鎖列表中指定的執行檔路徑；列表以外的程式皆可正常執行 |

**操作步驟：**

1. 從 Mode 下拉選單選擇 Whitelist 或 Blacklist
2. 點擊「**+ Add**」按鈕新增執行檔路徑，例如 `/bin/bash`、`/usr/bin/curl`
3. 可新增多筆路徑

**執行原理：** Tetragon 在 Kernel 層透過掛載 `sys_execve` kprobe 攔截所有 exec syscall，比對 TracingPolicy 規則後決定是否允許或阻擋執行。

---

## File Rules（檔案規則）

File Rules 用於控制 Pod 對檔案系統的讀寫存取行為，採用固定的 **Blacklist（黑名單）** 模式。

![File Rules 區段](/img/features/form-editor/file-rule.png)

**說明：** Blacklist 模式下，只有列表中指定的路徑會被封鎖，其餘路徑皆可正常存取。

**操作步驟：**

1. 點擊「**+ Add**」按鈕新增要封鎖的檔案或目錄路徑，例如 `/etc/passwd`、`/etc/shadow`、`/root/.ssh/`
2. 可新增多筆路徑

**執行原理：** Tetragon 透過掛載 `sys_read` 與 `sys_write` kprobe 監控所有檔案 I/O 操作，偵測到 Pod 存取封鎖路徑時，依 Policy 模式決定記錄或直接阻擋。

---

## Network Rules（網路規則）

Network Rules 用於控制 Pod 對外發起的 TCP 連線（Egress）。

![Network Rules 區段](/img/features/form-editor/network-rule.png)

**Mode 選項說明：**

| Mode | 類型 | 說明 |
|---|---|---|
| **NotDAddr — Whitelist** | 白名單 | 僅允許連線至列表中指定的 IP 位址；列表以外的連線目標皆被封鎖 |
| **DAddr — Blacklist** | 黑名單 | 封鎖連線至列表中指定的 IP 位址；列表以外的連線目標皆可正常連線 |

**設定區段：**

- **Addresses**：點擊「**+ Add**」新增目標 IP 位址（例如 `203.0.113.10`）
- **Ports**（選填）：點擊「**+ Add Port**」新增目標 Port；留空則比對所有 Port。Port 條件與 Address 條件以 AND 邏輯結合，即連線目標必須同時符合 IP 與 Port 才觸發規則

**執行原理：** Tetragon 透過掛載 `tcp_connect` kprobe 監控所有 TCP 連線建立事件，比對目標 IP 與 Port 是否符合規則後決定是否阻擋。
