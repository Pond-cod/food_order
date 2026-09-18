const path = require('path');
const fs = require('fs');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo";
const GAS_API_URL = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbwdD1v1L2luhHfejCEXaloSQMjz30HIx4wqCiftc7xS0Ja9TRxXWuy1Y-q686IjJPiZlw/exec";

let sheetsClient = null;

/**
 * สร้าง Google Sheets Client ผ่าน Service Account (ถ้ามีไฟล์ credentials.json หรือ env)
 */
function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  try {
    const credPath = path.join(__dirname, '../credentials.json');
    if (fs.existsSync(credPath)) {
      const { google } = require('googleapis');
      const auth = new google.auth.GoogleAuth({
        keyFile: credPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      sheetsClient = google.sheets({ version: 'v4', auth });
      return sheetsClient;
    }
  } catch (err) {
    console.warn("Could not initialize googleapis with credentials.json:", err.message);
  }

  return null;
}

module.exports = {
  SPREADSHEET_ID,
  GAS_API_URL,
  getSheetsClient,
};
