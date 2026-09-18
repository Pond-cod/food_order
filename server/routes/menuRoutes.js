const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// GET /api/menu - ดึงเมนูที่เปิดขายสำหรับลูกค้า
router.get('/', menuController.getAvailableMenus);

module.exports = router;
