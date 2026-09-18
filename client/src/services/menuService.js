import { apiRequest } from './api';

/**
 * ดึงรายการเมนูที่เปิดขายสำหรับลูกค้า
 */
export async function getAvailableMenus() {
  return await apiRequest('/menu');
}

/**
 * ดึงชื่อรอบปัจจุบัน
 */
export async function getCurrentRound() {
  return await apiRequest('/round');
}
