import React from 'react';

export default function AdminTabs({ activeTab, onTabChange, ordersCount = 0, role = 'Admin' }) {
  const normRole = (role || '').toLowerCase();
  const isSuperAdmin = normRole === 'superadmin';
  const isCook = normRole === 'cook' || normRole === 'kitchen';

  // กำหนดรายการแท็บทั้งหมด
  const allTabs = [
    { 
      id: 'schedule', 
      label: 'กำหนดหน้าสั่งอาหาร', 
      icon: 'fa-solid fa-calendar-check',
      description: 'รอบสั่ง, วันที่ & เมนูเปิดขาย',
      visible: isSuperAdmin || !isCook, // SuperAdmin & Admin
    },
    { 
      id: 'menus', 
      label: 'จัดการเมนูทั้งหมด', 
      icon: 'fa-solid fa-utensils',
      description: 'เพิ่ม/แก้ไข/ลบ/ปิด เมนู',
      visible: true, // ทุกคนเข้าได้
    },
    { 
      id: 'kitchen', 
      label: 'ออเดอร์ & ครัว', 
      icon: 'fa-solid fa-fire-burner',
      description: 'สรุปยอดครัว & รายการสั่งซื้อ',
      isProminent: true,
      visible: true, // ทุกคนเข้าได้ (สำหรับ Cook จะเด่นสุด)
    },
    { 
      id: 'admins', 
      label: 'ผู้ดูแลระบบ', 
      icon: 'fa-solid fa-user-shield',
      description: 'สิทธิ์ผู้ดูแล & เปิด/ปิด',
      visible: isSuperAdmin, // เฉพาะ SuperAdmin เท่านั้น
    },
  ];

  // กรองเฉพาะแท็บที่ได้รับอนุญาตตาม Role
  const tabs = allTabs.filter((t) => t.visible);

  // สำหรับ Cook จัดลำดับให้ออเดอร์ & ครัว ขึ้นอันดับแรก
  if (isCook) {
    tabs.sort((a, b) => (a.id === 'kitchen' ? -1 : 1));
  }

  return (
    <div className="overflow-x-auto pb-2 mb-4">
      <div className="d-flex flex-nowrap gap-2 align-items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isProminent) {
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-tab-kitchen text-nowrap rounded-3 fw-bold px-3 py-2 d-flex align-items-center gap-2 ${
                  isActive ? 'active' : ''
                }`}
                style={{ fontSize: '14px' }}
                onClick={() => onTabChange(tab.id)}
              >
                <i className={`${tab.icon} fs-6`}></i>
                <span>{tab.label}</span>
                {ordersCount > 0 && (
                  <span className="badge bg-white text-danger fw-bold rounded-pill kitchen-badge-pulse px-2 py-1" style={{ fontSize: '11px' }}>
                    {ordersCount}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={`btn text-nowrap rounded-3 fw-bold px-3 py-2 d-flex align-items-center gap-2 transition-all ${
                isActive 
                  ? 'bg-success text-white shadow-sm' 
                  : 'bg-white text-secondary border border-1 hover-shadow'
              }`}
              style={{ fontSize: '13.5px' }}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={`${tab.icon} ${isActive ? 'text-white' : 'text-success'}`}></i>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
