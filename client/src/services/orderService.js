import { apiRequest } from './api';

/**
 * ส่งข้อมูลการสั่งซื้ออาหารของลูกค้า
 */
export async function submitOrder(orderData) {
  return await apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}
