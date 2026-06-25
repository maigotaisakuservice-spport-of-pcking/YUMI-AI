/**
 * YUMI AI - GAS Relay System (Version 7.0)
 * スプレッドシートへのデータ蓄積と週次バッチ処理
 */

// GASの「プロジェクトの設定 > スクリプト プロパティ」から取得するように変更
const scriptProperties = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = scriptProperties.getProperty('SPREADSHEET_ID');
const SHEET_NAME = "YUMI_Memory";
const GITHUB_REPO = scriptProperties.getProperty('GITHUB_REPO');
const GITHUB_TOKEN = scriptProperties.getProperty('GITHUB_TOKEN');

/**
 * フロントエンドからのバッチリクエストを受信
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { batch, signature } = payload;

    // HMAC署名の検証
    if (!verifyHmac(JSON.stringify(batch), signature)) {
      return ContentService.createTextOutput(JSON.stringify({ status: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // バッチデータを一括追記
    batch.forEach(item => {
      sheet.appendRow([item.timestamp, item.type, JSON.stringify(item.data)]);
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 土曜0時に起動する週次バッチ
 */
function triggerWeeklyEvolution() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 0) return;

  const validEntries = [];

  // SHAキーの検証 (フロントエンドと共通のアルゴリズムを想定)
  data.forEach(row => {
    const [timestamp, keyword, expert_id, sha_key] = row;
    if (verifyShaKey(keyword, timestamp, sha_key)) {
      validEntries.push({ keyword, expert_id });
    }
  });

  if (validEntries.length > 0) {
    // GitHub Actions (workflow_dispatch) へ一括送信
    const success = sendToGitHubActions(validEntries);

    if (success) {
      // 送信成功後、シートをクリア (記憶の代謝)
      sheet.clear();
    }
  }
}

/**
 * HMAC署名の検証
 */
function verifyHmac(message, signature) {
  const secret = scriptProperties.getProperty('HMAC_SECRET');
  const expected = Utilities.computeHmacSha256Signature(message, secret)
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

/**
 * GitHub Actions APIを叩く
 */
function sendToGitHubActions(entries) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/yumi_weekly_evolution.yml/dispatches`;
  const payload = {
    ref: "main",
    inputs: {
      memory_data: JSON.stringify(entries)
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  return response.getResponseCode() === 204;
}
