const sheetService = require('../services/sheetService');

/**
 * GET /api/admin/check
 * ตรวจสอบสิทธิ์ Admin จาก LINE User ID
 */
async function checkAdmin(req, res, next) {
  try {
    const userId = req.query.userId || req.headers['x-admin-user-id'];
    const displayName = req.query.displayName || '';

    if (!userId) {
      return res.json({ status: 'success', isAdmin: false });
    }

    const check = await sheetService.checkAdmin(userId, displayName);
    res.json(check);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard
 * ดึงข้อมูลสรุปสำหรับหน้าแดชบอร์ด
 */
async function getDashboard(req, res, next) {
  try {
    const { userId, displayName } = req.adminUser;
    const data = await sheetService.getAdminDashboard(userId, displayName);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/admins
 * เพิ่มสิทธิ์ผู้ดูแลใหม่
 */
async function addAdmin(req, res, next) {
  try {
    const { newAdminUserId, newAdminName, role } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!newAdminUserId) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ LINE User ID' });
    }

    const result = await sheetService.addAdmin(newAdminUserId, newAdminName, role, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/admins/:rowIndex
 * ลบสิทธิ์ผู้ดูแล
 */
async function deleteAdmin(req, res, next) {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { userId, displayName } = req.adminUser;

    if (!rowIndex || rowIndex <= 1) {
      return res.status(400).json({ status: 'error', message: 'ไม่พบผู้ดูแลที่ต้องการลบ' });
    }

    const result = await sheetService.deleteAdmin(rowIndex, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/schedule
 * กำหนดหน้าสั่งอาหาร (รอบ, วันที่, และเมนูเปิดขาย)
 */
async function updateSchedule(req, res, next) {
  try {
    const { roundTitle, selectedDate, menuStatusMap } = req.body;
    const { userId, displayName } = req.adminUser;

    const result = await sheetService.updateSchedule(roundTitle, selectedDate, menuStatusMap, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/admins/status
 * สลับสถานะเปิด/ปิดใช้งานสิทธิ์ Admin
 */
async function toggleAdminStatus(req, res, next) {
  try {
    const { rowIndex, newStatus } = req.body;
    const { userId, displayName } = req.adminUser;

    const result = await sheetService.toggleAdminStatus(rowIndex, newStatus, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/admins/:rowIndex
 * แก้ไขข้อมูล Admin
 */
async function editAdmin(req, res, next) {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { userId: targetUserId, name, role } = req.body;
    const { userId, displayName } = req.adminUser;

    const result = await sheetService.editAdmin(rowIndex, targetUserId, name, role, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkAdmin,
  getDashboard,
  addAdmin,
  deleteAdmin,
  updateSchedule,
  toggleAdminStatus,
  editAdmin,
};
