function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents || '{}');
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '未設定 SPREADSHEET_ID' })).setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheets()[0];
    const record = [
      new Date(),
      requestData.original || '',
      requestData.translation || '',
      requestData.examples || '',
      requestData.source || ''
    ];

    sheet.appendRow(record);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
