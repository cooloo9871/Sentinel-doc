# Sentinel 技術文件網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 Docusaurus 為 Sentinel 建立完整技術文件網站，涵蓋從安裝到操作的全流程。

**Architecture:** Docusaurus 3.x 靜態站台，所有文件以 Markdown 撰寫，截圖存於 static/img，透過 sidebars.ts 控制側欄順序，Mermaid 圖表由 @docusaurus/theme-mermaid 渲染。

**Tech Stack:** Docusaurus 3.x、React 18、TypeScript、Mermaid、sharp（圖片處理）

---

## 檔案結構總覽

```
Sentinel-doc/
├── docs/
│   ├── intro.md                          ← 01 專案簡介
│   ├── architecture.md                   ← 02 架構說明
│   ├── prerequisites.md                  ← 03 前置需求
│   ├── installation/
│   │   ├── index.md                      ← 04 安裝概覽
│   │   ├── job-install.md                ← 05 Kubernetes Job 安裝
│   │   └── script-install.md             ← 06 本機腳本安裝
│   ├── access/
│   │   ├── port-forward.md               ← 07 Port-forward 存取
│   │   └── ingress.md                    ← 08 Ingress 存取
│   ├── features/
│   │   ├── dashboard.md                  ← 09 Dashboard 總覽
│   │   ├── tracing-policy.md             ← 10 TracingPolicy 管理
│   │   ├── form-editor.md                ← 11 表單編輯器
│   │   ├── yaml-editor.md                ← 12 YAML 編輯器
│   │   ├── execution-mode.md             ← 13 執行模式切換
│   │   ├── behavior-discovery.md         ← 14 行為發現（Behavior Discovery）
│   │   ├── notifications.md              ← 15 安全通知
│   │   └── namespace-view.md             ← 16 Namespace 檢視
│   ├── uninstall.md                      ← 17 解除安裝
│   └── troubleshooting.md                ← 18 故障排除
├── static/img/
│   ├── architecture/
│   │   └── overview.png
│   ├── installation/
│   │   ├── job-apply.png
│   │   ├── job-complete.png
│   │   ├── script-run.png
│   │   └── script-complete.png
│   ├── access/
│   │   ├── port-forward-cmd.png
│   │   └── ingress-yaml.png
│   └── features/
│       ├── dashboard/
│       │   ├── overview.png
│       │   └── stats.png
│       ├── policy/
│       │   ├── list.png
│       │   ├── create.png
│       │   ├── edit.png
│       │   └── delete.png
│       ├── form-editor/
│       │   ├── process-rule.png
│       │   ├── file-rule.png
│       │   └── network-rule.png
│       ├── yaml-editor/
│       │   ├── open.png
│       │   └── apply.png
│       ├── mode/
│       │   ├── monitoring.png
│       │   └── protect.png
│       ├── discovery/
│       │   ├── overview.png
│       │   └── generate-policy.png
│       ├── notifications/
│       │   ├── list.png
│       │   └── filter.png
│       └── namespace/
│           └── view.png
├── src/css/custom.css
├── docusaurus.config.ts
├── sidebars.ts
├── package.json
└── tsconfig.json
```

---

## Sidebar 規劃

```typescript
// sidebars.ts
const sidebars = {
  sentinelSidebar: [
    {
      type: 'category',
      label: '開始使用',
      collapsed: false,
      items: ['intro', 'architecture'],
    },
    {
      type: 'category',
      label: '安裝與部署',
      collapsed: false,
      items: [
        'prerequisites',
        'installation/index',
        'installation/job-install',
        'installation/script-install',
      ],
    },
    {
      type: 'category',
      label: '存取 UI',
      collapsed: false,
      items: ['access/port-forward', 'access/ingress'],
    },
    {
      type: 'category',
      label: '功能操作教學',
      collapsed: false,
      items: [
        'features/dashboard',
        'features/tracing-policy',
        'features/form-editor',
        'features/yaml-editor',
        'features/execution-mode',
        'features/behavior-discovery',
        'features/notifications',
        'features/namespace-view',
      ],
    },
    'uninstall',
    'troubleshooting',
  ],
};
```

---

## Task 1：初始化 Docusaurus 專案

**Files:**
- Create: `package.json`（由 npx create-docusaurus 產生）
- Create: `docusaurus.config.ts`
- Create: `sidebars.ts`
- Create: `src/css/custom.css`

- [ ] **Step 1.1：在 Sentinel-doc 目錄初始化 Docusaurus**

```bash
cd /home/bigred/Sentinel-doc
npx create-docusaurus@latest . classic --typescript --skip-install
```

預期輸出：產生 docusaurus.config.ts、sidebars.ts、docs/、src/ 等目錄結構。

- [ ] **Step 1.2：安裝相依套件**

```bash
cd /home/bigred/Sentinel-doc
npm install
```

預期：node_modules 安裝完成，無 error。

- [ ] **Step 1.3：安裝 Mermaid 支援**

```bash
npm install @docusaurus/theme-mermaid
```

- [ ] **Step 1.4：清空預設範例文件**

```bash
rm -rf docs/tutorial-basics docs/tutorial-extras blog
```

- [ ] **Step 1.5：Commit**

```bash
git add -A
git commit -m "feat: initialize Docusaurus project"
```

---

## Task 2：設定 docusaurus.config.ts

**Files:**
- Modify: `docusaurus.config.ts`（完整替換）

- [ ] **Step 2.1：寫入完整設定**

```typescript
// docusaurus.config.ts
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Sentinel',
  tagline: 'Kubernetes Cilium Tetragon Policy 管理平台',
  favicon: 'img/favicon.ico',
  url: 'https://your-domain.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'zh-TW', locales: ['zh-TW'] },
  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Sentinel',
      logo: { alt: 'Sentinel Logo', src: 'img/logo.svg' },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sentinelSidebar',
          position: 'left',
          label: '文件',
        },
        {
          href: 'https://github.com/cooloo9871/Sentinel',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'typescript'],
    },
    mermaid: {
      theme: { light: 'default', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
```

- [ ] **Step 2.2：Commit**

```bash
git add docusaurus.config.ts
git commit -m "feat: configure Docusaurus with Mermaid and zh-TW"
```

---

## Task 3：設定 sidebars.ts

**Files:**
- Modify: `sidebars.ts`（完整替換）

- [ ] **Step 3.1：寫入完整 sidebar 設定**

```typescript
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  sentinelSidebar: [
    {
      type: 'category',
      label: '開始使用',
      collapsed: false,
      items: ['intro', 'architecture'],
    },
    {
      type: 'category',
      label: '安裝與部署',
      collapsed: false,
      items: [
        'prerequisites',
        'installation/index',
        'installation/job-install',
        'installation/script-install',
      ],
    },
    {
      type: 'category',
      label: '存取 UI',
      collapsed: false,
      items: ['access/port-forward', 'access/ingress'],
    },
    {
      type: 'category',
      label: '功能操作教學',
      collapsed: false,
      items: [
        'features/dashboard',
        'features/tracing-policy',
        'features/form-editor',
        'features/yaml-editor',
        'features/execution-mode',
        'features/behavior-discovery',
        'features/notifications',
        'features/namespace-view',
      ],
    },
    'uninstall',
    'troubleshooting',
  ],
};

export default sidebars;
```

- [ ] **Step 3.2：Commit**

```bash
git add sidebars.ts
git commit -m "feat: configure sidebar for Sentinel docs"
```

---

## Task 4：擷取 Sentinel UI 截圖並標注紅框

**Files:**
- Create: `static/img/features/dashboard/overview.png`（及所有截圖）
- 使用 Playwright MCP 工具連線 http://172.20.7.100:8080

截圖清單（共 ~20 張）：

| 檔案路徑 | 對應頁面 | 標注元素 |
|---------|---------|---------|
| `static/img/features/dashboard/overview.png` | Dashboard 首頁 | 統計數字區塊 |
| `static/img/features/policy/list.png` | Policy 清單 | 「新增 Policy」按鈕 |
| `static/img/features/policy/create.png` | 建立 Policy 表單 | Policy 名稱欄位 |
| `static/img/features/policy/edit.png` | 編輯 Policy | 儲存按鈕 |
| `static/img/features/policy/delete.png` | 刪除確認對話框 | 確認刪除按鈕 |
| `static/img/features/form-editor/process-rule.png` | Process 規則表單 | 規則類型選擇 |
| `static/img/features/form-editor/file-rule.png` | File 規則表單 | 路徑輸入欄位 |
| `static/img/features/form-editor/network-rule.png` | Network 規則表單 | IP/Port 欄位 |
| `static/img/features/yaml-editor/open.png` | YAML 編輯器開啟 | YAML 預覽按鈕 |
| `static/img/features/yaml-editor/apply.png` | YAML 套用 | 套用按鈕 |
| `static/img/features/mode/monitoring.png` | 模式切換（監控） | 模式切換開關 |
| `static/img/features/mode/protect.png` | 模式切換（保護） | 模式切換開關啟用狀態 |
| `static/img/features/discovery/overview.png` | Behavior Discovery 頁面 | 工作負載清單 |
| `static/img/features/discovery/generate-policy.png` | 從發現結果產生 Policy | 「生成 Policy」按鈕 |
| `static/img/features/notifications/list.png` | 安全通知清單 | 嚴重性標籤 |
| `static/img/features/notifications/filter.png` | 通知過濾器 | Namespace 篩選下拉 |
| `static/img/features/namespace/view.png` | Namespace 檢視 | Namespace 列表 |

- [ ] **Step 4.1：建立截圖目錄**

```bash
mkdir -p static/img/{architecture,installation,access}
mkdir -p static/img/features/{dashboard,policy,form-editor,yaml-editor,mode,discovery,notifications,namespace}
```

- [ ] **Step 4.2：使用 Playwright 連線 Sentinel UI 並依清單逐頁截圖**

對每張截圖，使用 Python/ImageMagick 在「操作元素」上疊加紅色方框：

```bash
# 範例：用 ImageMagick 在座標 (x,y,w,h) 疊加紅框
convert input.png -stroke red -strokewidth 3 -fill none \
  -draw "rectangle x1,y1 x2,y2" output.png
```

- [ ] **Step 4.3：Commit 截圖**

```bash
git add static/img/
git commit -m "feat: add annotated UI screenshots"
```

---

## Task 5：撰寫文件 — 開始使用

**Files:**
- Create: `docs/intro.md`
- Create: `docs/architecture.md`

- [ ] **Step 5.1：撰寫 docs/intro.md**

內容結構：
1. Sentinel 是什麼（一段話）
2. 核心功能一覽（表格）
3. 適用對象
4. 文件閱讀指引（Mermaid flowchart 導覽流程）

- [ ] **Step 5.2：撰寫 docs/architecture.md**

內容結構：
1. 整體架構（Mermaid 架構圖：Browser → Go Server → K8s API → Tetragon）
2. 元件說明表格
3. 資料流說明（Mermaid sequence diagram）
4. 持久化儲存說明（/data/sentinel/）

- [ ] **Step 5.3：Commit**

```bash
git add docs/intro.md docs/architecture.md
git commit -m "docs: add intro and architecture pages"
```

---

## Task 6：撰寫文件 — 前置需求與安裝

**Files:**
- Create: `docs/prerequisites.md`
- Create: `docs/installation/index.md`
- Create: `docs/installation/job-install.md`
- Create: `docs/installation/script-install.md`

- [ ] **Step 6.1：docs/prerequisites.md**

內容：K8s 版本需求、Cilium 安裝確認指令、Tetragon 安裝確認指令、kubectl 設定確認、網路存取需求。

- [ ] **Step 6.2：docs/installation/index.md**

內容：兩種安裝方式比較表（Job vs Script），選擇建議。

- [ ] **Step 6.3：docs/installation/job-install.md**

內容：完整步驟 + 每步截圖 + 原理說明。包含 kubectl apply、Job 執行確認、Pod 狀態確認。

- [ ] **Step 6.4：docs/installation/script-install.md**

內容：完整步驟 + 每步截圖 + 原理說明。包含 clone、執行 install.sh、參數說明。

- [ ] **Step 6.5：Commit**

```bash
git add docs/prerequisites.md docs/installation/
git commit -m "docs: add prerequisites and installation pages"
```

---

## Task 7：撰寫文件 — 存取 UI

**Files:**
- Create: `docs/access/port-forward.md`
- Create: `docs/access/ingress.md`

- [ ] **Step 7.1：docs/access/port-forward.md**

內容：`kubectl port-forward` 指令、存取網址、適用場景（本機開發/測試）。

- [ ] **Step 7.2：docs/access/ingress.md**

內容：Ingress YAML 範例、Hostname 設定、適用場景（正式環境）。

- [ ] **Step 7.3：Commit**

```bash
git add docs/access/
git commit -m "docs: add UI access methods"
```

---

## Task 8：撰寫文件 — 功能操作教學（8 頁）

**Files:**
- Create: `docs/features/dashboard.md`
- Create: `docs/features/tracing-policy.md`
- Create: `docs/features/form-editor.md`
- Create: `docs/features/yaml-editor.md`
- Create: `docs/features/execution-mode.md`
- Create: `docs/features/behavior-discovery.md`
- Create: `docs/features/notifications.md`
- Create: `docs/features/namespace-view.md`

每頁結構：
- 功能說明（此功能是什麼）
- 操作步驟（含截圖 + 操作說明 + 原理解釋）

- [ ] **Step 8.1：dashboard.md** — 統計數字、叢集概覽
- [ ] **Step 8.2：tracing-policy.md** — 建立/編輯/刪除 Policy 完整 CRUD
- [ ] **Step 8.3：form-editor.md** — Process / File / Network 三種規則表單
- [ ] **Step 8.4：yaml-editor.md** — 開啟 YAML 預覽、直接編輯、套用
- [ ] **Step 8.5：execution-mode.md** — Monitoring ↔ Protect 切換與差異
- [ ] **Step 8.6：behavior-discovery.md** — 自動學習流程、從行為生成 Policy
- [ ] **Step 8.7：notifications.md** — 即時事件串流、過濾、嚴重性分類
- [ ] **Step 8.8：namespace-view.md** — Namespace 列表、Tetragon agent 健康狀態

- [ ] **Step 8.9：Commit**

```bash
git add docs/features/
git commit -m "docs: add all feature tutorial pages"
```

---

## Task 9：撰寫文件 — 解除安裝與故障排除

**Files:**
- Create: `docs/uninstall.md`
- Create: `docs/troubleshooting.md`

- [ ] **Step 9.1：uninstall.md** — 刪除 Deployment、清除 PV、移除 CRD 的指令

- [ ] **Step 9.2：troubleshooting.md**

常見問題清單：
| 問題 | 可能原因 | 解決方式 |
|------|---------|---------|
| UI 無法開啟 | Pod 未就緒 | 確認 Pod 狀態 |
| Policy 套用後無效 | Tetragon agent 未就緒 | 確認 agent DaemonSet |
| 登入失敗 | JWT secret 遺失 | 重新初始化 /data/sentinel/ |
| 截圖無法顯示 | 路徑錯誤 | 確認 static/img 路徑 |
| 行為發現無資料 | 缺少 Tetragon 權限 | 確認 RBAC ClusterRole |

- [ ] **Step 9.3：Commit**

```bash
git add docs/uninstall.md docs/troubleshooting.md
git commit -m "docs: add uninstall and troubleshooting pages"
```

---

## Task 10：最終驗證

- [ ] **Step 10.1：本機預覽**

```bash
npm run start
```

預期：瀏覽器自動開啟 http://localhost:3000，側邊欄顯示完整 18 頁文件。

- [ ] **Step 10.2：建置確認**

```bash
npm run build
```

預期：`build/` 目錄產生，無任何 broken link 或 warning。

- [ ] **Step 10.3：最終 Commit**

```bash
git add -A
git commit -m "docs: complete Sentinel documentation site"
```

---

## 自我審查 — Spec Coverage

| 需求項目 | 對應 Task |
|---------|---------|
| 專案簡介與架構說明 | Task 5 |
| 前置需求 | Task 6（prerequisites.md） |
| Job 安裝 | Task 6（job-install.md） |
| 腳本安裝 | Task 6（script-install.md） |
| Port-forward 存取 | Task 7 |
| Ingress 存取 | Task 7 |
| Dashboard | Task 8.1 |
| TracingPolicy 管理 | Task 8.2 |
| 表單編輯器 | Task 8.3 |
| YAML 編輯器 | Task 8.4 |
| 執行模式切換 | Task 8.5 |
| Behavior Discovery | Task 8.6 |
| 安全通知 | Task 8.7 |
| Namespace 檢視 | Task 8.8 |
| 解除安裝 | Task 9.1 |
| 故障排除 | Task 9.2 |
| 每步三要素（說明+原理+截圖） | Task 4 + Task 5-9 |
| 繁體中文 + 技術名詞原文 | 全部 Task |
| Mermaid 圖表 | Task 5 |
| 紅框標注截圖 | Task 4 |
