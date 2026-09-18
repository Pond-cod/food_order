const express = require('express');
const router = express.Router();
const roundController = require('../controllers/roundController');

// GET /api/round - ดึงรอบการสั่งซื้อปัจจุบัน
router.get('/', roundController.getCurrentRound);

module.exports = router;
