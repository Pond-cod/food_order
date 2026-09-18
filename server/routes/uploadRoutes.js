const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { requireAdmin } = require('../middlewares/authMiddleware');

// อัปโหลดรูปภาพไปยัง Google Drive Folder 1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR
router.post('/', requireAdmin, uploadController.uploadImage);

module.exports = router;
