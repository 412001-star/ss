# 古文解釋查詢前端專案

這是一個純前端古文解釋查詢應用，使用 HTML、CSS、JavaScript 實作，不使用任何前端框架。

## 功能

- 主頁可輸入文言文，查詢古文原文、白話翻譯與例句。
- 管理頁面可輸入查詢文字，自動呼叫 API 填入原文、白話翻譯、例句欄位。
- 管理頁面可儲存查詢結果至 Google 試算表（透過 Apps Script）。

## 專案檔案

- `index.html`：主查詢頁面。
- `admin.html`：管理頁面。
- `styles.css`：樣式表。
- `script.js`：前端邏輯。
- `apps-script-code.gs`：Apps Script 後端儲存到 Google 試算表。
- `appsscript.json`：Apps Script 專案設定。

## 使用方法

1. 將 `index.html` 和 `admin.html` 上傳至 GitHub Pages 的 repository root 或 docs 目錄。
2. 在 `script.js` 中設定：
   - `API_BASE_URL` 為你的古文查詢 API。
   - `GAS_WEB_APP_URL` 為部署後的 Apps Script Web App URL。
3. Apps Script 設定：
   - 將 `apps-script-code.gs` 與 `appsscript.json` 內容貼入。
   - 在 `PropertiesService` 的 `Script Properties` 中新增 `SPREADSHEET_ID`。
   - 部署為可供匿名或特定用戶存取的 Web App。

## Google Apps Script 部署說明

1. 建立新的 Google Apps Script 專案。
2. 將 `apps-script-code.gs` 與 `appsscript.json` 內容貼入。
3. 進入 `專案屬性` > `Script Properties`，新增 `SPREADSHEET_ID`，值為試算表 ID。
4. 部署為 Web App，並取得 `GAS_WEB_APP_URL`。
5. 更新 `script.js` 中 `GAS_WEB_APP_URL`。

## GitHub Pages

- 請將本專案部署到 GitHub Pages。
- `index.html` 為首頁，`admin.html` 為管理頁面。
- GitHub Pages 網址通常為：`https://<username>.github.io/<repository>/`

## 注意

- 若你尚未有真實 API，系統會使用範例 mock 資料回應。
- 若要與真實 API 串接，請替換 `API_BASE_URL`。
