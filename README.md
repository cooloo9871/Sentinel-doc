# Sentinel 文件站

[Sentinel](https://github.com/cooloo9871/Sentinel) 的官方技術文件，涵蓋安裝部署、功能操作教學與故障排除。

使用 [Docusaurus](https://docusaurus.io/) 建置，支援繁體中文 / English 雙語切換。

## 本機開發

安裝相依套件：

```bash
npm install
```

啟動開發伺服器（預設語系：繁體中文）：

```bash
npm run start
```

啟動英文語系開發伺服器：

```bash
npm run start -- --locale en
```

> 開發模式每次只能啟動單一語系。若需同時測試語言切換，請使用 `npm run serve`。

## 建置

```bash
npm run build
```

產出靜態檔案至 `build/` 目錄，同時建置所有語系。

## 預覽完整建置

```bash
npm run serve
```

在 `http://localhost:3000` 提供完整建置的靜態站台，語言切換功能可正常運作。若需對外提供存取（區域網路），已預設綁定 `0.0.0.0`。

## 新增或修改文件

| 路徑 | 說明 |
|------|------|
| `docs/` | 繁體中文文件（預設語系） |
| `i18n/en/docusaurus-plugin-content-docs/current/` | 英文翻譯文件 |
| `static/img/` | 圖片與截圖資源 |
| `sidebars.ts` | 側邊欄結構設定 |
| `docusaurus.config.ts` | 站台全域設定 |

新增一頁文件後，須同步更新 `sidebars.ts` 並在 `i18n/en/` 補上對應英文翻譯。
