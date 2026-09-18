import React from 'react';

export default function RoundCard({ round }) {
  return (
    <div className="card border-0 bg-success bg-opacity-10 text-success p-3 rounded-4 mb-3 d-flex flex-row justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: '13.5px' }}>
        <i className="fa-regular fa-clock"></i>
        <span>รอบการสั่งซื้อ:</span>
      </div>
      <div className="badge bg-white text-success shadow-sm px-3 py-2 fs-6 fw-bold rounded-3">
        {round || 'กำลังโหลดรอบ...'}
      </div>
    </div>
  );
}
