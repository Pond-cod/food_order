import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import {
  getAdminDashboard,
  saveMenu,
  toggleMenuStatus,
  deleteMenu,
  updateRound,
  updateOrderStatus,
  addAdmin,
  deleteAdmin,
} from '../services/adminService';
import AdminTabs from '../components/admin/AdminTabs';
import MenuTable from '../components/admin/MenuTable';
import MenuModal from '../components/admin/MenuModal';
import RoundSettings from '../components/admin/RoundSettings';
import KitchenSummary from '../components/admin/KitchenSummary';
import OrdersTable from '../components/admin/OrdersTable';
import CustomerModal from '../components/admin/CustomerModal';
import AdminTable from '../components/admin/AdminTable';
import AccessDenied from '../components/admin/AccessDenied';
import Loading from '../components/common/Loading';
import ImageModal from '../components/common/ImageModal';

export default function AdminPage({ onNavigateOrder }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
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

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadDashboard();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, authLoading]);

  async function loadDashboard() {
    try {
      // ถ้าไม่มีแคช ให้แสดงหน้าโหลด แต่ถ้ามีแคชแล้ว ให้โหลดเงียบๆ ในพื้นหลัง
      if (!dashboardData) setIsLoading(true);
      const res = await getAdminDashboard();
      if (res.status === 'success') {
        setDashboardData(res.data);
        try {
          localStorage.setItem('cached_admin_dashboard', JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เชื่อมต่อล้มเหลว',
        text: err.message.includes('404') 
          ? 'URL ของ Google Apps Script Web App เปลี่ยนไป (HTTP 404) กรุณาคัดลอก Web App URL ใหม่จากหน้า Deploy มาใส่ในระบบ' 
          : err.message
      });
    } finally {
      setIsLoading(false);
    }
  }

  // --- Menu Handlers ---
  async function handleSaveMenu(menuData) {
    try {
      setIsSaving(true);
      await saveMenu(menuData);
      setIsMenuModalOpen(false);
      setEditingMenu(null);
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกเมนูเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(rowIndex, newStatus) {
    // ตอบสนอง UI ทันทีใน 0.01 วินาที (Optimistic UI)
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updated = prev.menus.map((m) => (m.rowIndex === rowIndex ? { ...m, status: newStatus } : m));
      return { ...prev, menus: updated };
    });

    try {
      await toggleMenuStatus(rowIndex, newStatus);
    } catch (err) {
      // คืนค่าเดิมหากบันทึกล้มเหลว
      setDashboardData((prev) => {
        if (!prev) return prev;
        const oldStatus = newStatus === 'Available' ? 'Sold Out' : 'Available';
        const reverted = prev.menus.map((m) => (m.rowIndex === rowIndex ? { ...m, status: oldStatus } : m));
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
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ลบเมนูเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  }

  // --- Round Handlers ---
  async function handleSaveRound(newRound) {
    // ปรับรอบใน UI ทันที (Optimistic UI)
    setDashboardData((prev) => (prev ? { ...prev, currentRound: newRound } : prev));

    try {
      setIsSaving(true);
      await updateRound(newRound);
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'อัปเดตรอบเรียบร้อยแล้ว', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  // --- Order Handlers ---
  async function handleUpdateOrderStatus(rowIndex, newStatus) {
    // ปรับสถานะใน UI ทันที (Optimistic UI)
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updated = prev.orders.map((o) => (o.rowIndex === rowIndex ? { ...o, status: newStatus } : o));
      return { ...prev, orders: updated };
    });

    try {
      await updateOrderStatus(rowIndex, newStatus);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    }
  }

  // --- Admin Handlers ---
  async function handleAddAdmin(newUserId, newName, role) {
    try {
      setIsSaving(true);
      await addAdmin(newUserId, newName, role);
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เพิ่มผู้ดูแลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
      await loadDashboard();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAdmin(rowIndex, adminName) {
    const confirm = await Swal.fire({
      title: `ต้องการถอนสิทธิ์ "${adminName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ถอนสิทธิ์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#DC2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteAdmin(rowIndex);
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ถอนสิทธิ์เรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
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

  const { currentRound = '', menus = [], orders = [], admins = [] } = dashboardData || {};

  return (
    <div className="container-fluid container-xl py-3 py-md-4">
      <AdminTabs activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {activeTab === 'menu' && (
        <MenuTable
          menus={menus}
          onToggleStatus={handleToggleStatus}
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

      {activeTab === 'round' && (
        <RoundSettings
          currentRound={currentRound}
          onSaveRound={handleSaveRound}
          isSaving={isSaving}
        />
      )}

      {activeTab === 'orders' && (
        <>
          <KitchenSummary orders={orders} menus={menus} currentRound={currentRound} />
          <OrdersTable
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onOpenCustomerModal={(order) => setActiveCustomerOrder(order)}
          />
        </>
      )}

      {activeTab === 'admins' && (
        <AdminTable
          admins={admins}
          onAddAdmin={handleAddAdmin}
          onDeleteAdmin={handleDeleteAdmin}
          isSaving={isSaving}
        />
      )}

      {/* Modals */}
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

      <CustomerModal
        order={activeCustomerOrder}
        onClose={() => setActiveCustomerOrder(null)}
      />

      <ImageModal
        imageUrl={zoomImage ? zoomImage.url : null}
        title={zoomImage ? zoomImage.title : ''}
        onClose={() => setZoomImage(null)}
      />
    </div>
  );
}
