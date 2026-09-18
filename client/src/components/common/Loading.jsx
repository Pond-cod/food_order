import React from 'react';

export default function Loading({ message = 'กำลังโหลดข้อมูล...', submessage = 'กรุณารอสักครู่ ระบบกำลังเชื่อมต่อข้อมูล' }) {
  return (
    <div className="card text-center p-5 shadow-sm border-0 my-4" style={{ borderRadius: '16px' }}>
      <div className="d-flex justify-content-center mb-3">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      <h5 className="fw-bold text-dark mb-1">{message}</h5>
      <p className="text-muted small mb-0">{submessage}</p>
    </div>
  );
}
