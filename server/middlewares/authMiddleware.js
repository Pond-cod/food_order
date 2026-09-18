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

/**
 * Middleware ตรวจสอบสิทธิ์ SuperAdmin เท่านั้น
 */
function requireSuperAdmin(req, res, next) {
  if (!req.adminUser || req.adminUser.role !== 'SuperAdmin') {
    return res.status(403).json({
      status: 'error',
      message: 'ปฏิเสธการเข้าถึง: เฉพาะ SuperAdmin เท่านั้นที่สามารถดำเนินการนี้ได้',
    });
  }
  next();
}

/**
 * Middleware ป้องกันไม่ให้ Cook แก้ไขการตั้งค่ารอบหรือโครงสร้างเมนู
 */
function requireNotCook(req, res, next) {
  const role = (req.adminUser && req.adminUser.role || '').toLowerCase();
  if (role === 'cook' || role === 'kitchen') {
    return res.status(403).json({
      status: 'error',
      message: 'สิทธิ์ Cook ไม่สามารถดำเนินการนี้ได้',
    });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requireNotCook,
};
