const API_BASE_URL = "https://api.example.com/guwen";
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.value = text;
  } else {
    el.textContent = text;
  }
}

function getText(selector) {
  const el = document.querySelector(selector);
  return el ? el.value.trim() : "";
}

function notify(message, isError = false) {
  const status = document.querySelector("#status-message");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#c62828" : "#1f6feb";
}

function fillResult(data) {
  setText("#result-original", data.original || data.text || "無原文資料");
  setText("#result-translation", data.translation || "無翻譯資料");
  setText("#result-examples", data.examples || "無例句資料");
}

function fillAdminFields(data) {
  setText("#field-original", data.original || data.text || "");
  setText("#field-translation", data.translation || "");
  setText("#field-examples", data.examples || "");
}

function normalizeApiResponse(payload, query) {
  const data = payload?.data || payload?.result || payload;
  return {
    original: data.original || data.text || data.query || query,
    translation: data.translation || data.trans || data.meaning || data.content || "",
    examples: data.examples || data.example || data.exampleSentences || data.sentences || ""
  };
}

async function callGuwenApi(query) {
  if (!query) {
    throw new Error("請先輸入查詢內容。");
  }

  if (API_BASE_URL.includes("example.com")) {
    const sampleTranslation = query.includes("學而時習之，不亦樂乎")
      ? "時常溫習學過的東西，不也很快樂嗎？"
      : `這句話的白話大意是：「時常溫習所學的內容，不也是一件令人高興的事嗎？」`;

    return {
      original: query,
      translation: sampleTranslation,
      examples: `例句：若你能每天複習所學，便會如同「${query}」所說，感到十分愉快。`
    };
  }

  const url = `${API_BASE_URL}?text=${encodeURIComponent(query)}`;
  const response = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });

  if (!response.ok) {
    throw new Error(`API 呼叫失敗，狀態碼 ${response.status}`);
  }

  const payload = await response.json();

  if (!payload) {
    throw new Error("API 回傳資料格式錯誤。");
  }

  return normalizeApiResponse(payload, query);
}

async function queryMainPage() {
  const query = getText("#main-query");
  setText("#result-original", "查詢中...請稍候...");
  setText("#result-translation", "");
  setText("#result-examples", "");

  try {
    const data = await callGuwenApi(query);
    fillResult(data);
  } catch (error) {
    setText("#result-original", "查詢失敗，請檢查 API 設定。" );
    setText("#result-translation", error.message);
    setText("#result-examples", "");
  }
}

async function queryAdminPage() {
  const query = getText("#admin-query");
  notify("查詢中...請稍候...");

  try {
    const data = await callGuwenApi(query);
    fillAdminFields(data);
    notify("已自動填入原文、白話翻譯與例句。", false);
  } catch (error) {
    notify(error.message, true);
  }
}

async function saveToSheet() {
  const original = getText("#field-original");
  const translation = getText("#field-translation");
  const examples = getText("#field-examples");

  if (!original && !translation && !examples) {
    notify("請先填入原文、翻譯或例句。", true);
    return;
  }

  if (GAS_WEB_APP_URL.includes("YOUR_DEPLOYMENT_ID") || GAS_WEB_APP_URL.includes("example.com")) {
    notify("請先在 script.js 設定 GAS_WEB_APP_URL 為已部署的 Apps Script 網址。", true);
    return;
  }

  const payload = {
    original,
    translation,
    examples,
    source: window.location.href,
    timestamp: new Date().toISOString()
  };

  notify("儲存中...請稍候...");

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || result.status !== "success") {
      throw new Error(result.message || `儲存失敗，狀態碼 ${response.status}`);
    }

    notify("已成功儲存到 Google 試算表。", false);
  } catch (error) {
    notify(`儲存失敗：${error.message}`, true);
  }
}

function initPage() {
  const mainSearchButton = document.querySelector("#main-search");
  if (mainSearchButton) {
    mainSearchButton.addEventListener("click", queryMainPage);
  }

  const adminSearchButton = document.querySelector("#admin-search");
  if (adminSearchButton) {
    adminSearchButton.addEventListener("click", queryAdminPage);
  }

  const saveButton = document.querySelector("#save-sheet");
  if (saveButton) {
    saveButton.addEventListener("click", saveToSheet);
  }
}

window.addEventListener("DOMContentLoaded", initPage);
