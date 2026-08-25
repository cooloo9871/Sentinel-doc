---
id: form-editor
title: 表單編輯器
sidebar_position: 3
---

# 表單編輯器

## 功能說明

表單編輯器提供圖形化的視覺介面，讓使用者不需要手寫 YAML 即可設定 TracingPolicy 的三個區段：Pod Selector（目標 Pod 選擇）、Process Rules（行程規則）與 File Rules（檔案規則）。右側的 **Generated YAML** 面板會隨表單變更即時更新，方便確認產生的 TracingPolicy 內容。

點擊 Tracing Policy 列表頁的「**+ New Policy**」即進入表單編輯器；點擊既有 Policy 的「**Edit**」則以表單模式編輯該 Policy。若偏好直接撰寫 YAML，請改用「**+ New YAML**」（見 [YAML 編輯器](./yaml-editor.md)）。

![TracingPolicy 表單編輯器](/img/features/policy/create.png)

:::note
Pod 的**網路存取規則**已從 TracingPolicy 表單中移除，改由 [Network Policy](./network-policy.md)（Cilium Network Policy）統一管理。唯一的例外：**綁定行程上下文的網路控制**（例如「非白名單內的 binary 一發起對外連線就終止」）是 CNP 無法表達的（CNP 以工作負載身分判斷，無法區分 Pod 內的行程），這類 `tcp_connect` kprobe 仍可透過 [YAML 編輯器](./yaml-editor.md)撰寫；含網路 kprobe 的 Policy 在編輯時會以 YAML 模式開啟，避免表單儲存時遺失規則。
:::

---

## Basic Information（基本資訊）

| 欄位 | 必填 | 說明 |
|---|---|---|
| **Policy Name** | ✅ | TracingPolicy 資源名稱，需符合 Kubernetes 命名規範（小寫英文、數字與連字號） |
| **Namespace** | ✅ | 選擇目標 Namespace（建立 `TracingPolicyNamespaced`），或選擇 **cluster-wide** 建立套用全叢集的 `TracingPolicy` |

**執行模式（Mode）**：頁面右上角的 **Mode** 下拉選單設定此 Policy 的執行模式：

| Mode | 說明 |
|---|---|
| **Monitoring** | 僅記錄偵測到的事件，不阻擋任何行為 |
| **Protect** | 同時記錄事件並主動阻擋違規行為 |

---

## Pod Selector（目標選擇）

Pod Selector 區段允許您將此 TracingPolicy 的規則限縮到特定 Pod，而非套用至 Namespace 內所有 Pod。

**操作步驟：**

1. 點擊「**+ Add Label**」新增一組 key=value Label 篩選條件
2. 可新增多組 Label；所有條件之間為 AND 邏輯（Pod 必須同時符合所有 Label 才受此 Policy 管轄）
3. 若 Pod Selector 留空，則 Policy 套用至 Namespace 內全部 Pod（或 cluster-wide 時套用全叢集）

:::tip[Selector 即時預覽（v0.40+）]
編輯 Pod Selector 時，表單會即時顯示目前選擇器**實際匹配到哪些 Pod**。選不到任何 Pod 時以紅色警示（通常是 Label 打錯字）、空選擇器將套用到全部 Pod 時以橘色警示，讓「選錯對象」在 Apply 之前就被發現。
:::

---

## Process Rules（行程規則）

Process Rules 用於控制 Pod 內可以執行的程式（process/binary）。

**Mode 選項說明：**

| Mode | 說明 |
|---|---|
| **Whitelist** | 白名單：僅允許列表中指定的執行檔執行，其餘程式一律阻擋 |
| **Blacklist** | 黑名單：僅阻擋列表中指定的執行檔，其餘程式皆可正常執行 |

**操作步驟：**

1. 從 Mode 下拉選單選擇 Whitelist 或 Blacklist
2. 點擊「**+ Add**」新增執行檔路徑，例如 `/bin/bash`、`/usr/bin/curl`
3. 可新增多筆路徑

:::caution
路徑必須是**絕對路徑且完整比對**，僅輸入程式名稱（例如 `curl`）不會被接受。
:::

**執行原理：** Tetragon 在 Kernel 層掛載 `sys_execve` kprobe 攔截所有 exec syscall。Whitelist 模式以 `NotEqual` 運算子比對（不在列表內即違規）；Blacklist 模式以 `Equal` 運算子比對（在列表內即違規）。Monitoring 模式下違規僅記錄事件，Protect 模式下直接阻擋執行。

---

## File Rules（檔案規則）

File Rules 用於控制 Pod 對檔案系統的存取行為，採固定的 **Blacklist（黑名單）** 模式：只有列表中指定的路徑會被管制，其餘路徑皆可正常存取。

每條 File Rule 包含以下設定：

| 欄位 | 說明 |
|---|---|
| **Path** | 要管制的檔案或目錄路徑（例如 `/etc/shadow`、`/root/.ssh`），採**前綴（Prefix）比對**，填目錄即涵蓋其下所有檔案 |
| **Permission** | 管制的存取類型：`Deny Read & Write`（讀寫皆管制）、`Only Deny Read`（僅管制讀取）、`Only Deny Write`（僅管制寫入） |
| **Exceptions** | 選填；列出可**繞過此規則**的行程執行檔路徑（例如允許備份程式讀取管制目錄）。可新增多筆 |

**執行原理：** Tetragon 掛載 `security_file_permission` kprobe（LSM hook）監控檔案存取，以 Prefix 運算子比對路徑；Exceptions 透過 `matchBinaries: NotIn` 實現，讓指定的行程不受此規則影響。

---

## Generated YAML（即時預覽）

表單右側的 **Generated YAML** 面板會即時顯示依表單內容產生的 TracingPolicy YAML，面板右上角同時標示資源類型（`TracingPolicy` 或 `TracingPolicyNamespaced`）。每當表單有任何變更，預覽立即同步更新，方便在套用前確認最終內容。

確認無誤後，點擊頁面右上角的「**Apply**」即建立（或更新）Policy 並套用至叢集，Tetragon Agent 會在數秒內載入新規則。
