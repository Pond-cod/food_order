const { GOOGLE_DRIVE_FOLDER_ID, getDriveClient } = require('../config/googleDrive');
const { GAS_API_URL } = require('../config/googleSheets');
const { Readable } = require('stream');

/**
 * แปลง Base64 เป็น Buffer และ MimeType
 */
function parseBase64(base64String) {
  let mimeType = 'image/jpeg';
  let cleanBase64 = base64String;

  if (base64String.includes(',')) {
    const parts = base64String.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
    cleanBase64 = parts[1];
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  return { buffer, mimeType };
}

/**
 * อัปโหลดรูปภาพไปยัง Google Drive โฟลเดอร์ 1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR
 * @param {string} base64Data - ข้อมูลรูปภาพแบบ Base64
 * @param {string} fileName - ชื่อไฟล์
 * @returns {Promise<string>} Direct Image URL สำหรับแสดงผล
 */
async function uploadImageToDrive(base64Data, fileName = 'menu_image.jpg') {
  if (!base64Data) return '';

  const drive = getDriveClient();

  // กรณี 1: มี Google Drive API client จาก Service Account
  if (drive) {
    try {
      const { buffer, mimeType } = parseBase64(base64Data);
      const stream = Readable.from(buffer);

      const fileMetadata = {
        name: fileName.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F.-]/g, '_'),
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType,
        body: stream,
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      // ตั้งค่าสิทธิ์สาธารณะให้อ่านได้
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return `https://lh3.googleusercontent.com/d/${file.data.id}`;
    } catch (err) {
      console.warn("Direct Drive API upload failed, falling back to GAS connector:", err.message);
    }
  }

  // กรณี 2: Fallback ผ่าน Google Apps Script Connector ซึ่งมีสิทธิ์เข้าถึงโฟลเดอร์ 1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR อยู่แล้ว
  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'uploadImage',
        fileName,
        imageBase64: base64Data,
        adminUserId: 'SYSTEM_API',
        adminDisplayName: 'Server Service',
      }),
    });

    const result = await response.json();
    if (result && result.imageUrl) {
      return result.imageUrl;
    }
  } catch (err) {
    console.error("GAS Drive upload fallback error:", err.message);
  }

  throw new Error("ไม่สามารถอัปโหลดรูปภาพไปยัง Google Drive ได้");
}

module.exports = {
  uploadImageToDrive,
  parseBase64,
};
