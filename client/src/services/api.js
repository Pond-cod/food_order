const API_BASE_URL = '/api';
const DEFAULT_GAS_DIRECT_URL = "https://script.google.com/macros/s/AKfycbwdD1v1L2luhHfejCEXaloSQMjz30HIx4wqCiftc7xS0Ja9TRxXWuy1Y-q686IjJPiZlw/exec";

export function getGasDirectUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('custom_gas_url');
    if (saved && saved.trim()) return saved.trim();
  }
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GAS_URL)
    ? import.meta.env.VITE_GAS_URL
    : DEFAULT_GAS_DIRECT_URL;
}

/**
 * เมนูสำรองกรณีเครือข่ายขัดข้อง หรือ GAS Web App อยู่ระหว่างอัปเดตเวอร์ชัน
 */
const FALLBACK_MENUS = [
  { id: 1, name: "ข้าวกะเพราหมูกรอบ", price: 50, imageUrl: "https://lh3.googleusercontent.com/d/1c6_yEdavm5yKvsQ5zCJYsJ0PSyQIjwIR" },
  { id: 2, name: "ข้าวผัดหมู", price: 45, imageUrl: "" },
  { id: 3, name: "ข้าวไข่เจียวหมูสับ", price: 40, imageUrl: "" }
];

/**
 * เรียก Google Apps Script Web App โดยตรง (High Speed & Direct Connector)
 */
export async function callDirectGas(endpoint, options = {}) {
  const gasUrl = getGasDirectUrl();
  let action = '';
  let payload = {};

  if (options.body) {
    try {
      payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      payload = {};
    }
  }

  // ดึงข้อมูล Admin จาก LocalStorage
  let adminUserId = '';
  let adminDisplayName = '';
  try {
    const saved = localStorage.getItem('liff_admin_user');
    if (saved) {
      const p = JSON.parse(saved);
      adminUserId = p.userId || '';
      adminDisplayName = p.displayName || '';
    }
  } catch (e) {}

  const [path, queryString] = endpoint.split('?');

  if (path === '/menu' || path.startsWith('/menu')) {
    action = 'getAppData';
  } else if (path === '/orders' || path.startsWith('/orders')) {
    action = 'order';
  } else if (path === '/round' || path.startsWith('/round')) {
    action = 'getAppData';
  } else if (path === '/admin/check') {
    action = 'checkAdmin';
  } else if (path === '/admin/dashboard') {
    action = 'getAdminDashboard';
  } else if (path === '/admin/menu/status') {
    action = 'toggleMenuStatus';
  } else if (path === '/admin/menu' && options.method === 'POST') {
    action = 'saveMenu';
  } else if (path.startsWith('/admin/menu/') && options.method === 'DELETE') {
    action = 'deleteMenu';
    const parts = path.split('/');
    payload.rowIndex = parseInt(parts[parts.length - 1], 10);
  } else if (path === '/admin/round' && options.method === 'POST') {
    action = 'updateRound';
  } else if (path === '/admin/schedule' && options.method === 'POST') {
    action = 'updateSchedule';
  } else if (path.startsWith('/admin/orders/') && options.method === 'PATCH') {
    action = 'updateOrderStatus';
    const parts = path.split('/');
    payload.rowIndex = parseInt(parts[parts.length - 1], 10);
  } else if (path === '/admin/admins/status' && options.method === 'PATCH') {
    action = 'toggleAdminStatus';
  } else if (path.startsWith('/admin/admins/') && options.method === 'PUT') {
    action = 'editAdmin';
    const parts = path.split('/');
    payload.rowIndex = parseInt(parts[parts.length - 1], 10);
  } else if (path === '/admin/admins' && options.method === 'POST') {
    action = 'addAdmin';
  } else if (path.startsWith('/admin/admins/') && options.method === 'DELETE') {
    action = 'deleteAdmin';
    const parts = path.split('/');
    payload.rowIndex = parseInt(parts[parts.length - 1], 10);
  } else if (path === '/upload') {
    action = 'uploadImage';
  }

  const queryParams = new URLSearchParams(queryString || '');
  const userId = queryParams.get('userId') || adminUserId;
  const displayName = queryParams.get('displayName') || adminDisplayName;

  queryParams.set('action', action);
  if (userId) queryParams.set('userId', userId);
  if (displayName) queryParams.set('displayName', displayName);

  // ตั้ง Timeout 35 วินาที ป้องกันกรณีเน็ตหลุดหรือค้าง ขณะที่ให้เวลา GAS Cold-start เพียงพอ
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  const isGet = !options.method || options.method === 'GET';

  try {
    if (isGet) {
      const url = `${gasUrl}?${queryParams.toString()}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`GAS Direct HTTP Error: ${res.status}`);
      return await res.json();
    } else {
      const reqPayload = {
        action,
        adminUserId: userId,
        adminDisplayName: displayName,
        userId,
        displayName,
        ...payload,
      };

      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(reqPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`GAS Direct HTTP Error: ${res.status}`);
      return await res.json();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณารีเฟรชหรือลองใหม่อีกครั้ง');
    }

    // กรณีอ่านข้อมูลหน้าสั่งอาหาร (action === getAppData) แล้วเจอ 404 ให้ดึงจาก Local Cache ป้องกันหน้าจอว่างเปล่า
    if (action === 'getAppData') {
      console.warn(`[API] GAS Web App Error (${err.message}). Using local cache fallback...`);
      try {
        const cached = localStorage.getItem('liff_food_order_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.menus && parsed.menus.length > 0) {
            return {
              status: 'success',
              round: parsed.round || 'รอบปกติ',
              menus: parsed.menus,
              isOfflineFallback: true,
            };
          }
        }
      } catch (e) {}

      return {
        status: 'success',
        round: 'รอบปกติ',
        menus: FALLBACK_MENUS,
        isOfflineFallback: true,
      };
    }

    throw new Error(`ไม่สามารถเชื่อมต่อ Google Apps Script ได้ (${err.message}) กรุณาตรวจสอบการปรับใช้ Web App`);
  }
}

/**
 * Universal Fetch Request Wrapper
 * เมื่ออยู่บน Vercel / Production จะเรียก Google Apps Script โดยตรงเพื่อความเร็วสูงสุด
 */
export async function apiRequest(endpoint, options = {}) {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // ถ้าอยู่บน Production (เช่น Vercel) ให้ยิงตรงเข้า Google Apps Script ทันที (เร็วและไม่ค้าง)
  if (!isLocal) {
    return await callDirectGas(endpoint, options);
  }

  // สำหรับ Local Development เท่านั้น (Express บน Port 5000)
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const savedAdmin = localStorage.getItem('liff_admin_user');
    if (savedAdmin) {
      const parsed = JSON.parse(savedAdmin);
      if (parsed.userId) headers['x-admin-user-id'] = parsed.userId;
      if (parsed.displayName) headers['x-admin-display-name'] = encodeURIComponent(parsed.displayName);
    }
  } catch (e) {}

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

export default apiRequest;
