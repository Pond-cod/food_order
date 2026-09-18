const { SPREADSHEET_ID, GAS_API_URL, getSheetsClient } = require('../config/googleSheets');
const { uploadImageToDrive } = require('./driveService');

/**
 * เรียก API ผ่าน Google Apps Script Connector (Fallback / Direct Connector)
 */
async function callGasApi(payload, method = 'POST', queryParams = '') {
  const url = `${GAS_API_URL}${queryParams ? '?' + queryParams : ''}`;
  const options = {
    method,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  };

  if (method === 'POST' && payload) {
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`GAS API HTTP Error: ${res.status}`);
  }
  return await res.json();
}

/**
 * ดึงข้อมูลหน้าสั่งอาหารสำหรับลูกค้า (รอบปัจจุบัน + เมนูพร้อมขาย)
 */
async function getAppData() {
  const sheets = getSheetsClient();

  if (sheets) {
    try {
      // ดึงข้อมูลรอบปัจจุบันจากชีท Settings
      const settingsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Settings!A:B',
      });
      let currentRound = 'รอบปกติ';
      const sRows = settingsRes.data.values || [];
      for (const row of sRows) {
        const key = String(row[0] || '').trim().toLowerCase();
        if (key === 'currentround' || key === 'รอบปัจจุบัน') {
          currentRound = String(row[1] || '').trim() || currentRound;
          break;
        }
      }

      // ดึงเมนูจากชีท Menu
      const menuRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Menu!A:D',
      });
      const mRows = menuRes.data.values || [];
      const menus = [];

      for (let i = 1; i < mRows.length; i++) {
        const row = mRows[i];
        const name = String(row[0] || '').trim();
        const price = Number(row[1]) || 0;
        const status = String(row[2] || '').trim().toLowerCase();
        const imageUrl = String(row[3] || '').trim();

        if (name && (status === 'available' || status === 'พร้อมขาย' || status === '')) {
          menus.push({
            id: i,
            name,
            price,
            imageUrl,
          });
        }
      }

      return {
        status: 'success',
        round: currentRound,
        menus,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("Direct Sheets API read failed, falling back to GAS connector:", err.message);
    }
  }

  // Fallback ผ่าน GAS Connector
  return await callGasApi(null, 'GET', 'action=getAppData');
}

/**
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบ
 */
async function checkAdmin(userId, displayName) {
  return await callGasApi(null, 'GET', `action=checkAdmin&userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName || '')}`);
}

/**
 * ดึงข้อมูลสำหรับหน้าจอ Admin ทั้งหมด
 */
async function getAdminDashboard(userId, displayName) {
  return await callGasApi(null, 'GET', `action=getAdminDashboard&userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName || '')}`);
}

/**
 * ลูกค้าบันทึกออเดอร์
 */
async function createOrder(orderData) {
  const payload = {
    action: 'order',
    ...orderData,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * อัปเดตรอบการสั่งอาหาร (Admin)
 */
async function updateRound(newRound, adminUserId, adminDisplayName) {
  const payload = {
    action: 'updateRound',
    newRound,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * บันทึกหรือเพิ่มเมนูอาหาร (Admin)
 */
async function saveMenu(menuData, adminUserId, adminDisplayName) {
  let { name, price, status, imageUrl, imageBase64, rowIndex } = menuData;

  // หากมีภาพ Base64 ให้อัปโหลดเข้า Google Drive ก่อน
  if (imageBase64 && !imageUrl) {
    try {
      imageUrl = await uploadImageToDrive(imageBase64, name);
    } catch (e) {
      console.warn("Drive upload in saveMenu:", e.message);
    }
  }

  const payload = {
    action: 'saveMenu',
    rowIndex,
    name,
    price: Number(price),
    status: status || 'Available',
    imageUrl: imageUrl || '',
    imageBase64: imageBase64 || '',
    adminUserId,
    adminDisplayName,
  };

  return await callGasApi(payload, 'POST');
}

/**
 * สลับสถานะเปิดขาย/ปิดขาย (Admin)
 */
async function toggleMenuStatus(rowIndex, newStatus, adminUserId, adminDisplayName) {
  const payload = {
    action: 'toggleMenuStatus',
    rowIndex,
    newStatus,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * ลบเมนูอาหาร (Admin)
 */
async function deleteMenu(rowIndex, adminUserId, adminDisplayName) {
  const payload = {
    action: 'deleteMenu',
    rowIndex,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * อัปเดตสถานะออเดอร์ (Admin)
 */
async function updateOrderStatus(rowIndex, newStatus, adminUserId, adminDisplayName) {
  const payload = {
    action: 'updateOrderStatus',
    rowIndex,
    newStatus,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * เพิ่มผู้ดูแลระบบใหม่ (Admin)
 */
async function addAdmin(newAdminUserId, newAdminName, role, adminUserId, adminDisplayName) {
  const payload = {
    action: 'addAdmin',
    newAdminUserId,
    newAdminName,
    role: role || 'Admin',
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * ลบผู้ดูแลระบบ (Admin)
 */
async function deleteAdmin(rowIndex, adminUserId, adminDisplayName) {
  const payload = {
    action: 'deleteAdmin',
    rowIndex,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

module.exports = {
  getAppData,
  checkAdmin,
  getAdminDashboard,
  createOrder,
  updateRound,
  saveMenu,
  toggleMenuStatus,
  deleteMenu,
  updateOrderStatus,
  addAdmin,
  deleteAdmin,
};
