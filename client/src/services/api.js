const API_BASE_URL = '/api';
const GAS_DIRECT_URL = "https://script.google.com/macros/s/AKfycbwdD1v1L2luhHfejCEXaloSQMjz30HIx4wqCiftc7xS0Ja9TRxXWuy1Y-q686IjJPiZlw/exec";

/**
 * แปลงคำขอ REST ไปเป็น Direct GAS Web App Action อัตโนมัติ (High Performance & Failover)
 */
async function callDirectGas(endpoint, options = {}) {
  let action = '';
  let payload = {};

  if (options.body) {
    try {
      payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      payload = {};
    }
  }

  // ดึงสิทธิ์ Admin จาก LocalStorage
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
    action = 'getAvailableMenus';
  } else if (path === '/orders' || path.startsWith('/orders')) {
    action = 'order';
  } else if (path === '/round' || path.startsWith('/round')) {
    action = 'getRound';
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
  } else if (path.startsWith('/admin/orders/') && options.method === 'PATCH') {
    action = 'updateOrderStatus';
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

  const isGet = !options.method || options.method === 'GET';

  if (isGet) {
    const url = `${GAS_DIRECT_URL}?action=${action}&userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}${queryString ? '&' + queryString : ''}`;
    const res = await fetch(url);
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

    const res = await fetch(GAS_DIRECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(reqPayload),
    });

    if (!res.ok) throw new Error(`GAS Direct HTTP Error: ${res.status}`);
    return await res.json();
  }
}

/**
 * Universal Fetch Request Wrapper (พร้อม Failover ไปยัง Direct GAS อัตโนมัติ)
 */
export async function apiRequest(endpoint, options = {}) {
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // หากพบ 404 จาก Proxy ให้สลับเป็น Direct GAS ทันที
    if (response.status === 404) {
      console.warn(`[API] 404 on ${url}, switching to Direct GAS...`);
      return await callDirectGas(endpoint, options);
    }

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (err) {
    // ถ้า Network Error หรือ 404 ให้เรียก Direct GAS เป็น Fallback อัตโนมัติ
    if (err.message && (err.message.includes('404') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      console.warn(`[API] Fallback to Direct GAS for ${endpoint}:`, err.message);
      return await callDirectGas(endpoint, options);
    }
    throw err;
  }
}

export default apiRequest;
