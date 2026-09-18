const { checkAdmin } = require('../services/sheetService');

/**
 * Middleware ตรวจสอบสิทธิ์การเข้าถึงของผู้ดูแลระบบ (Admin)
 */
async function requireAdmin(req, res, next) {
  try {
    const adminUserId = req.headers['x-admin-user-id'] || req.body.adminUserId || req.query.adminUserId;
    const adminDisplayName = req.headers['x-admin-display-name'] || req.body.adminDisplayName || req.query.adminDisplayName || '';

    if (!adminUserId) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาระบุ LINE User ID เพื่อยืนยันสิทธิ์ผู้ดูแลระบบ',
      });
    }

    const check = await checkAdmin(adminUserId, adminDisplayName);
    if (!check || !check.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'ปฏิเสธการเข้าถึง: คุณไม่มีสิทธิ์จัดการระบบหลังบ้าน (Unauthorized)',
      });
    }

    req.adminUser = {
      userId: adminUserId,
      displayName: check.displayName || adminDisplayName,
      role: check.role || 'Admin',
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAdmin,
};
