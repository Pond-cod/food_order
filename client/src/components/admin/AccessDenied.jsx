import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function AccessDenied({ userId, onNavigateOrder }) {
  const [copied, setCopied] = useState(false);

  function copyUserId() {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      Swal.fire({
        icon: 'success',
        title: 'คัดลอกสำเร็จ!',
        text: 'นำ LINE User ID นี้ส่งให้แอดมินเพื่อขอสิทธิ์ได้เลยครับ',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  function shareUserIdViaLine() {
    if (!userId) return;
    const msg = `LINE User ID ของฉันสำหรับเพิ่มเป็นแอดมินระบบสั่งอาหาร:\n${userId}`;
    const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(msg)}`;
    window.open(shareUrl, '_blank');
  }

  return (
    <div className="card text-center p-4 p-md-5 border-0 shadow-sm rounded-4 mx-auto my-4 my-md-5" style={{ maxWidth: '500px' }}>
      <div 
        className="rounded-circle bg-warning bg-opacity-15 text-warning mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm"
        style={{ width: '76px', height: '76px', fontSize: '32px' }}
      >
        <i className="fa-solid fa-key text-warning"></i>
      </div>

      <h4 className="fw-bold text-dark mb-2">ขอรับสิทธิ์ผู้ดูแลระบบ</h4>
      <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
        บัญชี LINE ของคุณยังไม่ได้อยู่ในรายชื่อผู้ดูแลระบบ<br/>
        โปรดส่ง <b>LINE User ID</b> ด้านล่างนี้ให้ผู้ดูแลหลักเพื่อเปิดสิทธิ์การใช้งาน
      </p>

      {/* User ID Box */}
      <div className="p-3 bg-light border border-dashed rounded-4 mb-3 text-start">
        <small className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '11.5px' }}>
          <i className="fa-brands fa-line text-success me-1"></i>LINE User ID ของคุณ:
        </small>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <code className="text-dark fw-bold small text-truncate px-2 py-1 bg-white rounded border flex-grow-1" style={{ fontSize: '13px' }}>
            {userId || 'กำลังตรวจสอบ...'}
          </code>
          <button
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-1 px-3 ${copied ? 'btn-success text-white' : 'btn-light border'}`}
            onClick={copyUserId}
          >
            <i className={`fa-${copied ? 'solid fa-check' : 'regular fa-copy'}`}></i>
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>
      </div>

      {/* Primary Action: Share to LINE */}
      <div className="d-grid gap-2 mb-3">
        <button
          type="button"
          className="btn btn-success py-2 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
          onClick={shareUserIdViaLine}
        >
          <i className="fa-brands fa-line fs-5"></i>
          <span>ส่ง User ID ให้แอดมินทาง LINE</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary py-2 d-flex align-items-center justify-content-center gap-2 rounded-3"
          onClick={onNavigateOrder}
        >
          <i className="fa-solid fa-bowl-food"></i>
          <span>กลับไปหน้าสั่งอาหาร</span>
        </button>
      </div>

      <small className="text-muted" style={{ fontSize: '11px' }}>
        💡 เมื่อผู้ดูแลเพิ่ม ID ของคุณเรียบร้อยแล้ว ให้รีเฟรชหน้านี้เพื่อเข้าใช้งาน
      </small>
    </div>
  );
}
