const sheetService = require('../services/sheetService');

/**
 * GET /api/round
 * ดึงรอบการสั่งอาหารปัจจุบัน
 */
async function getCurrentRound(req, res, next) {
  try {
    const data = await sheetService.getAppData();
    res.json({ status: 'success', round: data.round });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/round
 * อัปเดตชื่อรอบการสั่งอาหาร
 */
async function updateRound(req, res, next) {
  try {
    const { newRound } = req.body;
    const { userId, displayName } = req.adminUser;

    if (!newRound || !newRound.trim()) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุชื่อรอบ' });
    }

    const result = await sheetService.updateRound(newRound.trim(), userId, displayName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCurrentRound,
  updateRound,
};
