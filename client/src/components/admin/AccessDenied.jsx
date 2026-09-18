import React from 'react';

export default function AccessDenied({ userId, onNavigateOrder }) {
  function copyUserId() {
    if (userId) {
      navigator.clipboard.writeText(userId);
      alert('คัดลอก LINE User ID เรียบร้อยแล้ว');
    }
  }

  return (
    <div className="card text-center p-4 p-md-5 border-0 shadow-sm rounded-4 mx-auto my-5" style={{ maxWidth: '480px' }}>
      <div 
        className="rounded-circle bg-danger bg-opacity-10 text-danger mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{ width: '72px', height: '72px', fontSize: '32px' }}
      >
        <i className="fa-solid fa-shield-halved"></i>
      </div>

      <h4 className="fw-bold text-dark mb-2">ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล</h4>
      <p className="text-muted small mb-4" style={{ lineHeight: '1.6' }}>
        บัญชี LINE ของคุณยังไม่ได้รับการแต่งตั้งให้เป็นผู้ดูแลระบบ หากคุณเป็นเจ้าของร้าน โปรดคัดลอก User ID นี้ไปเพิ่มในชีท <b>Admins</b> ใน Google Sheets
      </p>

      {/* Copy Box */}
      <div className="d-flex align-items-center justify-content-between p-2 bg-light border border-dashed rounded-3 mb-4">
        <code className="text-dark small text-truncate px-2" style={{ maxWidth: '280px' }}>
          {userId || 'กำลังตรวจสอบ...'}
        </code>
        <button
          type="button"
          className="btn btn-sm btn-light border d-flex align-items-center gap-1"
          onClick={copyUserId}
        >
          <i className="fa-regular fa-copy"></i>
          <span>คัดลอก</span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn-success py-2 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
        onClick={onNavigateOrder}
      >
        <i className="fa-solid fa-bowl-food"></i>
        <span>กลับไปหน้าสั่งอาหาร</span>
      </button>
    </div>
  );
}
