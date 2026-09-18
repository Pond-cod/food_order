const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST /api/orders - สั่งอาหาร
router.post('/', orderController.placeOrder);

module.exports = router;
