const API_BASE_URL = '/api';

/**
 * Universal Fetch Request Wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // ดึง LINE User ID จาก LocalStorage ใส่ใน Header สำหรับคำขอของ Admin
  try {
    const savedAdmin = localStorage.getItem('liff_admin_user');
    if (savedAdmin) {
      const parsed = JSON.parse(savedAdmin);
      if (parsed.userId) headers['x-admin-user-id'] = parsed.userId;
      if (parsed.displayName) headers['x-admin-display-name'] = encodeURIComponent(parsed.displayName);
    }
  } catch (e) {}

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

export default apiRequest;
