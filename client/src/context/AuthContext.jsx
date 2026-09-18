import React, { createContext, useContext, useState, useEffect } from 'react';
import liff from '@line/liff';
import { checkAdminStatus } from '../services/adminService';

const LIFF_ID = "2011625055-XnlJJcQp";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initLiff();
  }, []);

  async function initLiff() {
    try {
      setLoading(true);

      // ตรวจสอบกรณี Local Development หรือ Browser นอก LINE
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log("Running in Local Dev mode - configuring Mock/Dev profile");
        const devUser = {
          userId: 'U_DEV_ADMIN_001',
          displayName: 'ผู้ดูแลระบบ (Dev)',
          pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          statusMessage: 'Local Developer Mode',
        };
        setUser(devUser);
        localStorage.setItem('liff_admin_user', JSON.stringify(devUser));

        try {
          const adminCheck = await checkAdminStatus(devUser.userId, devUser.displayName);
          setIsAdmin(adminCheck.isAdmin ?? true);
          setAdminRole(adminCheck.role || 'SuperAdmin');
        } catch (e) {
          setIsAdmin(true);
          setAdminRole('SuperAdmin');
        }
        setLoading(false);
        return;
      }

      await liff.init({ liffId: LIFF_ID });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      setUser(profile);
      localStorage.setItem('liff_admin_user', JSON.stringify(profile));

      // ตรวจสอบสิทธิ์ Admin จาก Backend
      try {
        const adminCheck = await checkAdminStatus(profile.userId, profile.displayName);
        setIsAdmin(adminCheck.isAdmin || false);
        setAdminRole(adminCheck.role || '');
      } catch (e) {
        console.warn("Check admin error:", e);
      }

      setLoading(false);
    } catch (err) {
      console.error("LIFF Init Error:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, adminRole, loading, error, refreshAuth: initLiff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
