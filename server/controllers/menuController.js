const sheetService = require('../services/sheetService');

/**
 * GET /api/menu
 * ดึงรายการเมนูที่เปิดขายสำหรับลูกค้า
 */
async function getAvailableMenus(req, res, next) {
  try {
    const data = await sheetService.getAppData();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/menu
 * เพิ่มเมนูใหม่ หรือแก้ไขเมนูเดิม
 */
async function saveMenu(req, res, next) {
  try {
    const { name, price, status, imageUrl, imageBase64, rowIndex } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุชื่อและราคาเมนูให้ครบถ้วน' });
    }

    const result = await sheetService.saveMenu(
      { name, price, status, imageUrl, imageBase64, rowIndex },
      userId,
      displayName
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/menu/status
 * สลับสถานะเปิดขาย / ปิดขาย
 */
async function toggleStatus(req, res, next) {
  try {
    const { rowIndex, newStatus } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!rowIndex || !newStatus) {
      return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const result = await sheetService.toggleMenuStatus(rowIndex, newStatus, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/menu/:rowIndex
 * ลบเมนูอาหาร
 */
async function deleteMenu(req, res, next) {
  try {
    const rowIndex = parseInt(req.params.rowIndex, 10);
    const { userId, displayName } = req.adminUser;

    if (!rowIndex || rowIndex <= 1) {
      return res.status(400).json({ status: 'error', message: 'ไม่พบแถวเมนูที่ต้องการลบ' });
    }

    const result = await sheetService.deleteMenu(rowIndex, userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvailableMenus,
  saveMenu,
  toggleStatus,
  deleteMenu,
};
