const path = require('path');
const fs = require('fs');

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR";

let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  try {
    const credPath = path.join(__dirname, '../credentials.json');
    if (fs.existsSync(credPath)) {
      const { google } = require('googleapis');
      const auth = new google.auth.GoogleAuth({
        keyFile: credPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    }
  } catch (err) {
    console.warn("Could not initialize googleapis with credentials.json for Drive:", err.message);
  }

  return null;
}

module.exports = {
  GOOGLE_DRIVE_FOLDER_ID,
  getDriveClient,
};
