const { SPREADSHEET_ID, GAS_API_URL, getSheetsClient } = require('../config/googleSheets');
const { uploadImageToDrive } = require('./driveService');

// ==========================================
// In-Memory Fast Cache (TTL)
// ==========================================
const memoryCache = new Map();

function getCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttlMs = 60000) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

function clearCache() {
  memoryCache.clear();
}

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
  const data = await res.json();
  if (data && data.status === 'error') {
    throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ GAS');
  }
  return data;
}

/**
 * ดึงข้อมูลหน้าสั่งอาหารสำหรับลูกค้า (รอบปัจจุบัน + เมนูพร้อมขาย)
 * พร้อมระบบ Cache 60 วินาที เพื่อความเร็วระดับมิลลิวินาที
 */
async function getAppData() {
  const cached = getCache('appData');
  if (cached) return cached;

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

      const result = {
        status: 'success',
        round: currentRound,
        menus,
        timestamp: new Date().toISOString(),
      };

      setCache('appData', result, 60000);
      return result;
    } catch (err) {
      console.warn("Direct Sheets API read failed, falling back to GAS connector:", err.message);
    }
  }

  // Fallback ผ่าน GAS Connector
  const data = await callGasApi(null, 'GET', 'action=getAppData');
  if (data && data.status === 'success') {
    setCache('appData', data, 60000);
  }
  return data;
}

/**
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบ
 */
async function checkAdmin(userId, displayName) {
  const cacheKey = `admin_check_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const result = await callGasApi(null, 'GET', `action=checkAdmin&userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName || '')}`);
  if (result && result.status === 'success') {
    setCache(cacheKey, result, 300000); // แคชสิทธิ์ Admin 5 นาที
  }
  return result;
}

/**
 * ดึงข้อมูลสำหรับหน้าจอ Admin ทั้งหมด
 */
async function getAdminDashboard(userId, displayName) {
  const cacheKey = `dashboard_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const result = await callGasApi(null, 'GET', `action=getAdminDashboard&userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName || '')}`);
  if (result && result.status === 'success') {
    setCache(cacheKey, result, 30000); // แคชแดชบอร์ด 30 วินาที
  }
  return result;
}

/**
 * ลูกค้าบันทึกออเดอร์
 */
async function createOrder(orderData) {
  clearCache();
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
  clearCache();
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
  clearCache();
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
  clearCache();
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
  clearCache();
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
async function updateOrderStatus(rowIndex, newStatus, notifyCustomer = true, adminUserId, adminDisplayName) {
  clearCache();
  const payload = {
    action: 'updateOrderStatus',
    rowIndex,
    newStatus,
    notifyCustomer,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * เพิ่มผู้ดูแลระบบใหม่ (Admin)
 */
async function addAdmin(newAdminUserId, newAdminName, role, adminUserId, adminDisplayName) {
  clearCache();
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
  clearCache();
  const payload = {
    action: 'deleteAdmin',
    rowIndex,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * กำหนดหน้าสั่งอาหาร (รอบ, วันที่, และสถานะเมนู)
 */
async function updateSchedule(roundTitle, selectedDate, menuStatusMap, adminUserId, adminDisplayName) {
  clearCache();
  const payload = {
    action: 'updateSchedule',
    roundTitle,
    selectedDate,
    menuStatusMap,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * สลับสถานะเปิด/ปิดใช้งานสิทธิ์ Admin
 */
async function toggleAdminStatus(rowIndex, newStatus, adminUserId, adminDisplayName) {
  clearCache();
  const payload = {
    action: 'toggleAdminStatus',
    rowIndex,
    newStatus,
    adminUserId,
    adminDisplayName,
  };
  return await callGasApi(payload, 'POST');
}

/**
 * แก้ไขข้อมูลผู้ดูแลระบบ
 */
async function editAdmin(rowIndex, userId, name, role, adminUserId, adminDisplayName) {
  clearCache();
  const payload = {
    action: 'editAdmin',
    rowIndex,
    userId,
    name,
    role,
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
  updateSchedule,
  toggleAdminStatus,
  editAdmin,
};
