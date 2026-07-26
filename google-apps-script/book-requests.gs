/**
 * Google Apps Script — Book Build Request Webhook
 *
 * Deployment:
 * 1. Create a Google Sheet named "B5K Book Requests"
 * 2. Open Extensions → Apps Script
 * 3. Paste this code
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and set it as VITE_BOOK_REQUEST_WEBHOOK
 *
 * Sheet columns: Timestamp | Username | Email | Topic | CodexType | Language | Category | Country | Score
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Append to sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date().toISOString(),
      data.username || '',
      data.email || '',
      data.topic || '',
      data.codexType || '',
      data.language || 'en',
      data.category || '',
      data.country || '',
      data.score || 0,
    ]);

    // Send email notification
    var subject = 'New Book Build Request: ' + (data.topic || 'Untitled');
    var body = [
      'New book build request received:',
      '',
      'Topic: ' + (data.topic || 'N/A'),
      'CodexType: ' + (data.codexType || 'N/A'),
      'Language: ' + (data.language || 'en'),
      'Category: ' + (data.category || 'N/A'),
      'Country: ' + (data.country || 'N/A'),
      'Score: ' + (data.score || 0),
      '',
      'User: ' + (data.username || 'anonymous'),
      'Email: ' + (data.email || 'N/A'),
      '',
      'Submitted: ' + new Date().toISOString(),
    ].join('\n');

    MailApp.sendEmail('wfz@nimblebooks.com', subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'B5K Book Request Webhook' }))
    .setMimeType(ContentService.MimeType.JSON);
}
