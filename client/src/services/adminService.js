import { apiRequest } from './api';

/**
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบ
 */
export async function checkAdminStatus(userId, displayName = '') {
  return await apiRequest(`/admin/check?userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}`);
}

/**
 * ดึงข้อมูลรวมสำหรับ Dashboard
 */
export async function getAdminDashboard() {
  return await apiRequest('/admin/dashboard');
}

/**
 * เพิ่มหรือแก้ไขเมนูอาหาร
 */
export async function saveMenu(menuData) {
  return await apiRequest('/admin/menu', {
    method: 'POST',
    body: JSON.stringify(menuData),
  });
}

/**
 * สลับสถานะเปิดขาย / ปิดขาย
 */
export async function toggleMenuStatus(rowIndex, newStatus) {
  return await apiRequest('/admin/menu/status', {
    method: 'PATCH',
    body: JSON.stringify({ rowIndex, newStatus }),
  });
}

/**
 * ลบเมนูอาหาร
 */
export async function deleteMenu(rowIndex) {
  return await apiRequest(`/admin/menu/${rowIndex}`, {
    method: 'DELETE',
  });
}

/**
 * อัปเดตรอบการสั่งอาหาร
 */
export async function updateRound(newRound) {
  return await apiRequest('/admin/round', {
    method: 'POST',
    body: JSON.stringify({ newRound }),
  });
}

/**
 * อัปเดตสถานะออเดอร์ (Completed / Cancelled)
 */
export async function updateOrderStatus(rowIndex, newStatus) {
  return await apiRequest(`/admin/orders/${rowIndex}`, {
    method: 'PATCH',
    body: JSON.stringify({ newStatus }),
  });
}

/**
 * เพิ่มผู้ดูแลระบบใหม่
 */
export async function addAdmin(newAdminUserId, newAdminName, role = 'Admin') {
  return await apiRequest('/admin/admins', {
    method: 'POST',
    body: JSON.stringify({ newAdminUserId, newAdminName, role }),
  });
}

/**
 * ลบผู้ดูแลระบบ
 */
export async function deleteAdmin(rowIndex) {
  return await apiRequest(`/admin/admins/${rowIndex}`, {
    method: 'DELETE',
  });
}

/**
 * อัปโหลดรูปภาพไปยัง Google Drive โฟลเดอร์ 1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR
 */
export async function uploadImageToDrive(imageBase64, fileName) {
  return await apiRequest('/upload', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, fileName }),
  });
}
