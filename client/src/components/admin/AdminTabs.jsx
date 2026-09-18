import React from 'react';

export default function AdminTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'menu', label: 'จัดการเมนูประจำวัน', icon: 'fa-solid fa-bowl-rice' },
    { id: 'round', label: 'ตั้งค่ารอบการสั่ง', icon: 'fa-regular fa-clock' },
    { id: 'orders', label: 'ออเดอร์ & ครัว', icon: 'fa-solid fa-clipboard-list' },
    { id: 'admins', label: 'ผู้ดูแลระบบ', icon: 'fa-solid fa-users-gear' },
  ];

  return (
    <div className="overflow-x-auto pb-2 mb-3">
      <ul className="nav nav-pills flex-nowrap gap-2">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link d-flex align-items-center gap-2 text-nowrap rounded-3 fw-bold px-3 py-2 ${
                activeTab === tab.id ? 'active bg-success text-white shadow-sm' : 'bg-white text-secondary border'
              }`}
              style={{ fontSize: '13.5px' }}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
