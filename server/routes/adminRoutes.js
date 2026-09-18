const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const roundController = require('../controllers/roundController');
const { requireAdmin } = require('../middlewares/authMiddleware');

// ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ไม่ต้องใช้ requireAdmin เพราะเป็นการเช็คเบื้องต้น)
router.get('/check', adminController.checkAdmin);

// เส้นทางต่อไปนี้ต้องผ่านการตรวจสอบสิทธิ์ Admin ทั้งหมด
router.use(requireAdmin);

// Dashboard Data
router.get('/dashboard', adminController.getDashboard);

// Menu Management
router.post('/menu', menuController.saveMenu);
router.patch('/menu/status', menuController.toggleStatus);
router.delete('/menu/:rowIndex', menuController.deleteMenu);

// Round & Schedule Management
router.post('/round', roundController.updateRound);
router.post('/schedule', adminController.updateSchedule);

// Orders Management
router.patch('/orders/:rowIndex', orderController.updateStatus);

// Admins Management
router.post('/admins', adminController.addAdmin);
router.patch('/admins/status', adminController.toggleAdminStatus);
router.put('/admins/:rowIndex', adminController.editAdmin);
router.delete('/admins/:rowIndex', adminController.deleteAdmin);

module.exports = router;
