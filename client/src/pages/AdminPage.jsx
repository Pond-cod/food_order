import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import {
  getAdminDashboard,
  saveMenu,
  toggleMenuStatus,
  deleteMenu,
  saveSchedule,
  updateOrderStatus,
  addAdmin,
  editAdmin,
  toggleAdminStatus,
  deleteAdmin,
} from '../services/adminService';
import AdminTabs from '../components/admin/AdminTabs';
import ScheduleSettings from '../components/admin/ScheduleSettings';
import MenuTable from '../components/admin/MenuTable';
import MenuModal from '../components/admin/MenuModal';
import KitchenOrdersView from '../components/admin/KitchenOrdersView';
import AdminTable from '../components/admin/AdminTable';
import CustomerModal from '../components/admin/CustomerModal';
import AccessDenied from '../components/admin/AccessDenied';
import Loading from '../components/common/Loading';
import ImageModal from '../components/common/ImageModal';

const VALID_TABS = ['schedule', 'menus', 'kitchen', 'admins'];

export default function AdminPage({ onNavigateOrder }) {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // จัดการ Tab ผ่าน URL Hash (เช่น #admin/schedule, #admin/menus, #admin/kitchen, #admin/admins)
  const getTabFromHash = () => {
    try {
      const hash = window.location.hash || '';
      const match = hash.replace('#', '').replace('admin/', '');
      if (VALID_TABS.includes(match)) {
        return match;
      }
    } catch (e) {}
    return 'schedule';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  // Sync กับ hash change event
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = `admin/${tab}`;
  };

  const [dashboardData, setDashboardData] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_admin_dashboard');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem('cached_admin_dashboard');
    } catch (e) {
      return true;
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  const loadDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsLoading((prev) => (!localStorage.getItem('cached_admin_dashboard')));
      }
      const res = await getAdminDashboard();
      if (res && res.status === 'success') {
        setDashboardData(res.data);
        try {
          localStorage.setItem('cached_admin_dashboard', JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
      // หากยังไม่มีข้อมูลแคชในหน้าจอเลย ถึงจะแสดง Error Dialog
      const hasCached = !!localStorage.getItem('cached_admin_dashboard');
      if (!hasCached && !isSilent) {
        Swal.fire({
          icon: 'error',
          title: 'เชื่อมต่อล้มเหลว',
          text: err.message.includes('404')
            ? 'URL ของ Google Apps Script Web App เปลี่ยนไป (HTTP 404) กรุณาคัดลอก Web App URL ใหม่จากหน้า Deploy มาใส่ในระบบ'
            : err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadDashboard();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, authLoading, loadDashboard]);

  // ========================================================
  // 1. Feature: กำหนดหน้าสั่งอาหาร (Schedule & Daily Menus)
  // ========================================================
  async function handleSaveSchedule({ roundTitle, selectedDate, menuStatusMap }) {
    // Optimistic UI update ทันที
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updatedMenus = (prev.menus || []).map((m) => {
        const isChecked = !!menuStatusMap[m.rowIndex];
        return { ...m, status: isChecked ? 'Available' : 'Sold Out' };
      });
      return {
        ...prev,
        currentRound: roundTitle,
        menus: updatedMenus,
      };
    });

    try {
      setIsSaving(true);
      await saveSchedule({ roundTitle, selectedDate, menuStatusMap });
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: `ตั้งค่ารอบ "${roundTitle}" และเมนูเปิดขายเรียบร้อยแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
      await loadDashboard();
    } finally {
      setIsSaving(false);
    }
  }

  // ========================================================
  // 2. Feature: จัดการเมนูทั้งหมด (Master Menu Catalog)
  // ========================================================
  async function handleSaveMenu(menuData) {
    try {
      setIsSaving(true);
      await saveMenu(menuData);
      setIsMenuModalOpen(false);
      setEditingMenu(null);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'บันทึกเมนูเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleMenuStatus(rowIndex, newStatus) {
    // Optimistic UI
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updated = prev.menus.map((m) =>
        m.rowIndex === rowIndex ? { ...m, status: newStatus } : m
      );
      return { ...prev, menus: updated };
    });

    try {
      await toggleMenuStatus(rowIndex, newStatus);
    } catch (err) {
      // Revert if error
      setDashboardData((prev) => {
        if (!prev) return prev;
        const oldStatus = newStatus === 'Available' ? 'Sold Out' : 'Available';
        const reverted = prev.menus.map((m) =>
          m.rowIndex === rowIndex ? { ...m, status: oldStatus } : m
        );
        return { ...prev, menus: reverted };
      });
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  }

  async function handleDeleteMenu(rowIndex, menuName) {
    const confirm = await Swal.fire({
      title: `ต้องการลบเมนู "${menuName}"?`,
      text: 'การกระทำนี้จะลบรายการออกจาก Google Sheets ทันที',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเมนู',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#DC2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteMenu(rowIndex);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ลบเมนูเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  }

  // ========================================================
  // 3. Feature: ออเดอร์ & ครัว (Kitchen & Orders)
  // ========================================================
  async function handleUpdateOrderStatus(rowIndex, newStatus) {
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updated = prev.orders.map((o) =>
        o.rowIndex === rowIndex ? { ...o, status: newStatus } : o
      );
      return { ...prev, orders: updated };
    });

    try {
      await updateOrderStatus(rowIndex, newStatus);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
      await loadDashboard();
    }
  }

  // ========================================================
  // 4. Feature: ผู้ดูแลระบบ (Admin Access Control)
  // ========================================================
  async function handleAddAdmin(newUserId, newName, role) {
    try {
      setIsSaving(true);
      await addAdmin(newUserId, newName, role);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'เพิ่มผู้ดูแลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditAdmin(rowIndex, userId, name, role) {
    try {
      setIsSaving(true);
      await editAdmin(rowIndex, userId, name, role);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'แก้ไขข้อมูลผู้ดูแลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleAdminStatus(rowIndex, newStatus) {
    // Optimistic UI
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updatedAdmins = (prev.admins || []).map((a) =>
        a.rowIndex === rowIndex ? { ...a, status: newStatus } : a
      );
      return { ...prev, admins: updatedAdmins };
    });

    try {
      await toggleAdminStatus(rowIndex, newStatus);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
      await loadDashboard();
    }
  }

  async function handleDeleteAdmin(rowIndex, adminName) {
    const confirm = await Swal.fire({
      title: `ต้องการถอนสิทธิ์ "${adminName}"?`,
      text: 'ผู้ใช้นี้จะไม่สามารถเข้าถึงระบบหลังบ้านได้อีกต่อไป',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ถอนสิทธิ์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#DC2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteAdmin(rowIndex);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ถอนสิทธิ์เรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container py-5" style={{ maxWidth: '600px' }}>
        <Loading message="กำลังโหลดข้อมูลระบบผู้ดูแล..." />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied userId={user ? user.userId : ''} onNavigateOrder={onNavigateOrder} />;
  }

  const {
    currentRound = '',
    menus = [],
    orders = [],
    admins = [],
    kitchenSummary = {},
  } = dashboardData || {};

  // คำนวณจำนวนออเดอร์ที่ยังไม่เสร็จ (Pending/Cooking) สำหรับ Badge แจ้งเตือนบน Tab
  const activeOrdersCount = orders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s === 'pending' || s === 'cooking' || s === 'รอดำเนินการ' || s === 'กำลังปรุง';
  }).length;

  return (
    <div className="container-fluid container-xl py-3 py-md-4">
      {/* 4 Dedicated Tabs Navigation with Kitchen Prominence */}
      <AdminTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ordersCount={activeOrdersCount || orders.length}
      />

      {/* Feature 1: กำหนดหน้าสั่งอาหาร (Schedule & Daily Menus) */}
      {activeTab === 'schedule' && (
        <ScheduleSettings
          currentRound={currentRound}
          allMenus={menus}
          onSaveSchedule={handleSaveSchedule}
          isSaving={isSaving}
        />
      )}

      {/* Feature 2: จัดการเมนูทั้งหมด (Master Menu Catalog) */}
      {activeTab === 'menus' && (
        <MenuTable
          menus={menus}
          onToggleStatus={handleToggleMenuStatus}
          onEditMenu={(menu) => {
            setEditingMenu(menu);
            setIsMenuModalOpen(true);
          }}
          onDeleteMenu={handleDeleteMenu}
          onZoomImage={(url, title) => setZoomImage({ url, title })}
          onOpenAddModal={() => {
            setEditingMenu(null);
            setIsMenuModalOpen(true);
          }}
        />
      )}

      {/* Feature 3: ออเดอร์ & ครัว (Kitchen & Orders) - Most Prominent */}
      {activeTab === 'kitchen' && (
        <KitchenOrdersView
          orders={orders}
          menus={menus}
          kitchenSummary={kitchenSummary}
          currentRound={currentRound}
          onUpdateStatus={handleUpdateOrderStatus}
          onViewCustomer={(order) => setActiveCustomerOrder(order)}
          onRefresh={loadDashboard}
          isLoading={isLoading}
        />
      )}

      {/* Feature 4: ผู้ดูแลระบบ (Admin Access Control) */}
      {activeTab === 'admins' && (
        <AdminTable
          admins={admins}
          onAddAdmin={handleAddAdmin}
          onEditAdmin={handleEditAdmin}
          onToggleAdminStatus={handleToggleAdminStatus}
          onDeleteAdmin={handleDeleteAdmin}
          isSaving={isSaving}
        />
      )}

      {/* --- Modals --- */}
      {/* Menu Edit/Add Modal */}
      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => {
          setIsMenuModalOpen(false);
          setEditingMenu(null);
        }}
        onSave={handleSaveMenu}
        editingMenu={editingMenu}
        isSaving={isSaving}
      />

      {/* Customer Full Details Modal */}
      <CustomerModal
        order={activeCustomerOrder}
        onClose={() => setActiveCustomerOrder(null)}
      />

      {/* Image Preview Modal */}
      <ImageModal
        imageUrl={zoomImage ? zoomImage.url : null}
        title={zoomImage ? zoomImage.title : ''}
        onClose={() => setZoomImage(null)}
      />
    </div>
  );
}
