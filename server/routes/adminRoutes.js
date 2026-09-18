const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const roundController = require('../controllers/roundController');
const { requireAdmin, requireSuperAdmin, requireNotCook } = require('../middlewares/authMiddleware');

// ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ไม่ต้องใช้ requireAdmin เพราะเป็นการเช็คเบื้องต้น)
router.get('/check', adminController.checkAdmin);

// เส้นทางต่อไปนี้ต้องผ่านการตรวจสอบสิทธิ์ Admin ทั้งหมด
router.use(requireAdmin);

// Dashboard Data (ทุกคนเข้าดูได้ตามบทบาท)
router.get('/dashboard', adminController.getDashboard);

// Menu Management
router.post('/menu', requireNotCook, menuController.saveMenu);
router.patch('/menu/status', menuController.toggleStatus); // ทุกคนรวมทั้ง Cook เปิด/ปิดขายได้
router.delete('/menu/:rowIndex', requireNotCook, menuController.deleteMenu);

// Round & Schedule Management (SuperAdmin & Admin only)
router.post('/round', requireNotCook, roundController.updateRound);
router.post('/schedule', requireNotCook, adminController.updateSchedule);

// Orders Management (ทุกคนรวมทั้ง Cook จัดการได้)
router.patch('/orders/:rowIndex', orderController.updateStatus);

// Admins Management (SuperAdmin ONLY)
router.post('/admins', requireSuperAdmin, adminController.addAdmin);
router.patch('/admins/status', requireSuperAdmin, adminController.toggleAdminStatus);
router.put('/admins/:rowIndex', requireSuperAdmin, adminController.editAdmin);
router.delete('/admins/:rowIndex', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;
