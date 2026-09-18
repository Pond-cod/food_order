const sheetService = require('../services/sheetService');

/**
 * POST /api/orders
 * ลูกค้าสั่งอาหาร
 */
async function placeOrder(req, res, next) {
  try {
    const { round, userId, displayName, pictureUrl, statusMessage, phone, department, menuName, quantity, note } = req.body;

    if (!menuName) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกเมนูอาหาร' });
    }

    const result = await sheetService.createOrder({
      round,
      userId,
      displayName,
      pictureUrl,
      statusMessage,
      phone,
      department,
      menuName,
      quantity: parseInt(quantity, 10) || 1,
      note,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/orders/:rowIndex
 * อัปเดตสถานะออเดอร์ (Completed / Cancelled)
 */
async function updateStatus(req, res, next) {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { newStatus } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!rowIndex || !newStatus) {
      return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const result = await sheetService.updateOrderStatus(rowIndex, newStatus, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  placeOrder,
  updateStatus,
};
