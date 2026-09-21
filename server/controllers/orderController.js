const sheetService = require('../services/sheetService');

/**
 * POST /api/orders
 * ลูกค้าสั่งอาหาร
 */
async function placeOrder(req, res, next) {
  try {
    const { round, userId, displayName, pictureUrl, statusMessage, phone, department, menuName, quantity, note, items } = req.body;

    const hasItems = Array.isArray(items) && items.length > 0;
    if (!hasItems && !menuName) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกเมนูอาหารอย่างน้อย 1 รายการ' });
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
      items: hasItems ? items : undefined,
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
    const { newStatus, notifyCustomer = true } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!rowIndex || !newStatus) {
      return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const result = await sheetService.updateOrderStatus(rowIndex, newStatus, notifyCustomer, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  placeOrder,
  updateStatus,
};
