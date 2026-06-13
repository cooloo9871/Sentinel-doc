# Logo 替換 + 中英雙語切換 Design Spec

**Date:** 2026-06-14  
**Status:** Approved

---

## Goal

1. 將 Docusaurus navbar 左上角的恐龍 logo 替換為 Sentinel 品牌 lockup（圖示 + 文字 + 副標題）。
2. 新增繁體中文 / 英文雙語支援，navbar 出現語言切換下拉選單。

---

## Part 1：Logo 替換

### 選定方案

**完整 Lockup，透明背景**（由使用者在視覺比較中選定 Option B）

- 使用 `sentinel-lockup-light.svg` 的構圖，去除白色背景 rect 與 border stroke
- 淺色模式：深色文字（#0B0F19）+ 深色圖示路徑，適用於白色 navbar
- 深色模式：白色文字 + 白色圖示路徑，適用於深色 (#1b1b1d) navbar
- `navbar.title` 設為 `''`（空字串），避免與 lockup 內建的 "Sentinel" 文字重複

### 交付檔案

| 檔案 | 用途 |
|------|------|
| `static/img/sentinel-lockup.svg` | 淺色模式 navbar logo（深色元素，透明背景） |
| `static/img/sentinel-lockup-dark.svg` | 深色模式 navbar logo（白色元素，透明背景） |

### Config 變更（docusaurus.config.ts）

```typescript
navbar: {
  title: '',   // lockup SVG 已含文字，清空避免重複
  logo: {
    alt: 'Sentinel',
    src: 'img/sentinel-lockup.svg',
    srcDark: 'img/sentinel-lockup-dark.svg',
  },
  ...
}
```

---

## Part 2：中英雙語 i18n

### 選定方案

**標準 Docusaurus i18n**（方案 1）

- `zh-TW` 維持預設語系（URL 根路徑 `/`）
- 新增 `en` 語系（URL 前綴 `/en/`）
- Navbar 加入內建 `localeDropdown` 切換器

### 目錄結構

```
i18n/
└── en/
    ├── docusaurus-plugin-content-docs/
    │   ├── current.json                  ← sidebar 分類標籤（英文）
    │   └── current/
    │       ├── intro.md
    │       ├── architecture.md
    │       ├── prerequisites.md
    │       ├── installation/
    │       │   ├── index.md
    │       │   ├── job-install.md
    │       │   └── script-install.md
    │       ├── access/
    │       │   ├── port-forward.md
    │       │   └── ingress.md
    │       ├── features/
    │       │   ├── dashboard.md
    │       │   ├── tracing-policy.md
    │       │   ├── form-editor.md
    │       │   ├── yaml-editor.md
    │       │   ├── execution-mode.md
    │       │   ├── behavior-discovery.md
    │       │   ├── notifications.md
    │       │   └── namespace-view.md
    │       ├── uninstall.md
    │       └── troubleshooting.md
    └── docusaurus-theme-classic/
        ├── navbar.json                   ← navbar 項目標籤（英文）
        └── footer.json                   ← footer 連結標籤（英文）
```

### Config 變更（docusaurus.config.ts）

```typescript
i18n: {
  defaultLocale: 'zh-TW',
  locales: ['zh-TW', 'en'],
  localeConfigs: {
    'zh-TW': { label: '繁體中文' },
    en: { label: 'English' },
  },
},
```

Navbar items 新增：
```typescript
{
  type: 'localeDropdown',
  position: 'right',
},
```

### current.json（sidebar 分類標籤）

Key 格式由 `npm run write-translations -- --locale en` 自動產生，不手動定義。
產生後編輯 `i18n/en/docusaurus-plugin-content-docs/current.json`，將各 category label 填入對應英文：

| 繁體中文 | English |
|---------|---------|
| 開始使用 | Getting Started |
| 安裝與部署 | Installation |
| 存取 UI | Accessing the UI |
| 功能操作教學 | Feature Tutorials |
| 解除安裝 | Uninstall |
| 常見問題與故障排除 | Troubleshooting |

### 英文文件範圍

全部 18 頁完整翻譯，frontmatter `title` 欄位改為英文，內容全英文。技術名詞（TracingPolicy、Tetragon、kubectl 等）保留原文。

---

## 實作順序

1. 建立兩個 lockup SVG 檔案（透明背景，淺/深色版本）
2. 更新 `docusaurus.config.ts`（logo + i18n + localeDropdown）
3. 建立 `i18n/en/` 目錄結構與 JSON 翻譯檔
4. 翻譯全部 18 頁文件為英文
5. `npm run build` 驗證

---

## 成功標準

- [ ] Navbar 左上角顯示 Sentinel lockup（淺色/深色模式各自正確）
- [ ] Navbar 右側出現語言切換下拉（繁體中文 / English）
- [ ] 切換至 English 後，sidebar 分類標籤、所有文件頁面內容均為英文
- [ ] `npm run build` 無 error
