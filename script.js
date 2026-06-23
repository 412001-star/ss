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

function simpleClassicalTranslation(query) {
  const phraseMap = {
    "學而時習之，不亦樂乎？": "時常溫習學過的東西，不也很高興嗎？",
    "子曰：學而時習之，不亦說乎？": "孔子說：學了就常常溫習，不也很開心嗎？",
    "知之者不如好之者，好之者不如樂之者。": "知道它的人不如喜歡它的人，喜歡它的人不如以它為樂的人。",
    "人無遠慮，必有近憂。": "人如果沒有長遠的打算，必定會有眼前的憂患。",
    "學而不思則罔，思而不學則殆。": "學了不思考就會迷失，思考了但不學習就會陷入危險。",
    "見賢思齊焉。": "見到有德行的人，應該想到要向他看齊。",
    "勿以惡小而為之勿以善小而不為": "不要因為壞事很小就去做；不要因為好事很小就不去做。",
    "勿以惡小而為它勿以善小而不為": "不要因為壞事很小就去做；不要因為好事很小就不去做。"
  };

  if (phraseMap[query]) {
    return phraseMap[query];
  }

  const normalized = query.replace(/[，。？！]/g, "");
  const replacements = [
    ["子曰", "孔子說"],
    ["曰", "說"],
    ["不亦樂乎", "不也很高興嗎"],
    ["不亦說乎", "不也很高興嗎"],
    ["學而時習之", "學習了就經常溫習它"],
    ["時習之", "經常溫習它"],
    ["學而不思則罔", "學了不思考就會迷失"],
    ["思而不學則殆", "思考了不學習就會陷入危險"],
    ["知之者不如好之者", "知道它的人不如喜歡它的人"],
    ["好之者不如樂之者", "喜歡它的人不如以它為樂的人"],
    ["人無遠慮", "人如果沒有長遠的打算"],
    ["必有近憂", "必定會有眼前的憂患"],
    ["見賢思齊焉", "見到有德行的人，要想到跟他看齊"],
    ["無", "沒有"],
    ["必有", "一定會有"],
    ["近憂", "眼前的憂患"],
    ["好之者", "喜歡它的人"],
    ["樂之者", "以它為樂的人"],
    ["焉", "吧"],
    ["則", "就"],
    ["罔", "迷失"],
    ["殆", "危險"],
    ["之", "它"],
    ["者", "的人"]
  ];

  let translation = normalized;
  replacements.forEach(([from, to]) => {
    translation = translation.split(from).join(to);
  });

  translation = translation.replace(/ +/g, " ").trim();
  translation = translation.replace(/的人的人/g, "的人");

  if (!translation || translation === normalized) {
    return `這句古文的大意是：${normalized}`;
  }

  return translation;
}

async function callGuwenApi(query) {
  if (!query) {
    throw new Error("請先輸入查詢內容。");
  }

  if (API_BASE_URL.includes("example.com")) {
    const sampleTranslation = simpleClassicalTranslation(query);
    const sampleExample = sampleTranslation.includes("不要因為壞事很小")
      ? "例句：不要因為一件很小的壞事就去做；做一件很小的好事，也要去做。"
      : `例句：例如將「${query}」理解為現代語句後，可以更容易掌握它的意思：${sampleTranslation}`;

    return {
      original: query,
      translation: sampleTranslation,
      examples: sampleExample
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
