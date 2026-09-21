import React, { useState } from 'react';
import { LINE_ADD_FRIEND_URL, LINE_ADD_FRIEND_BTN_IMG, LINE_QR_CODE } from '../../utils/assets';

export default function LineFriendModal({ isOpen, onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    if (dontShowAgain) {
      try {
        localStorage.setItem('has_seen_line_friend_modal', 'true');
      } catch (e) {}
    }
    onClose();
  }

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        animation: 'fadeInModal 0.25s ease-out'
      }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-4 shadow-lg overflow-hidden position-relative w-100 text-center"
        style={{
          maxWidth: '440px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          animation: 'scaleUpModal 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div 
          className="py-3 px-4 text-white position-relative"
          style={{
            background: 'linear-gradient(135deg, #06C755 0%, #05A044 100%)',
          }}
        >
          <button 
            type="button" 
            className="btn-close btn-close-white position-absolute top-50 end-0 translate-middle-y me-3"
            style={{ fontSize: '12px' }}
            onClick={handleClose}
            aria-label="Close"
          ></button>

          <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-2" style={{ width: '46px', height: '46px' }}>
            <i className="fa-brands fa-line fs-2" style={{ color: '#06C755' }}></i>
          </div>
          <h5 className="fw-bold mb-1">เพิ่มเพื่อน LINE Official Account</h5>
          <p className="small mb-0 text-white text-opacity-90" style={{ fontSize: '13px' }}>
            เพื่อรับใบเสร็จ, แจ้งเตือนสถานะอาหาร และสั่งรอบถัดไป
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          {/* Method 1: LINE Button */}
          <div className="mb-3">
            <div className="text-secondary small fw-medium mb-2" style={{ fontSize: '13px' }}>
              แตะปุ่มด้านล่างเพื่อเพิ่มเพื่อนทันที
            </div>
            <a 
              href={LINE_ADD_FRIEND_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="d-inline-block transition-transform"
              style={{ transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img 
                src={LINE_ADD_FRIEND_BTN_IMG} 
                alt="เพิ่มเพื่อน" 
                height="42" 
                border="0" 
                style={{ borderRadius: '6px', boxShadow: '0 4px 12px rgba(6, 199, 85, 0.3)' }}
              />
            </a>
          </div>

          {/* Divider */}
          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1 my-0 text-muted opacity-25" />
            <span className="px-3 text-muted small fw-semibold" style={{ fontSize: '12px' }}>หรือ สแกน QR Code</span>
            <hr className="flex-grow-1 my-0 text-muted opacity-25" />
          </div>

          {/* Method 2: QR Code Scan */}
          <div className="mb-3">
            <div 
              className="p-2 bg-white rounded-3 d-inline-block shadow-sm"
              style={{ border: '2px solid #E2E8F0' }}
            >
              <img 
                src={LINE_QR_CODE} 
                alt="QR Code เพิ่มเพื่อน LINE" 
                style={{ width: '175px', height: '175px', display: 'block' }} 
              />
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '12px' }}>
              <i className="fa-solid fa-camera me-1 text-success"></i>
              เปิดแอป LINE แล้วสแกนคิวอาร์โค้ดนี้ได้ทันที
            </div>
          </div>

          {/* Checkbox: Don't show again */}
          <div className="form-check d-flex justify-content-center align-items-center gap-2 mb-3">
            <input 
              className="form-check-input mt-0" 
              type="checkbox" 
              id="dontShowLineModal"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ cursor: 'pointer', width: '17px', height: '17px' }}
            />
            <label 
              className="form-check-label small text-secondary user-select-none" 
              htmlFor="dontShowLineModal" 
              style={{ cursor: 'pointer', fontSize: '13px' }}
            >
              ไม่ต้องแสดงหน้านี้อีก
            </label>
          </div>

          {/* Enter / Close Button */}
          <button 
            type="button" 
            className="btn w-100 fw-bold py-2 rounded-3 text-white shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, #06C755 0%, #05A044 100%)',
              fontSize: '15px'
            }}
            onClick={handleClose}
          >
            เข้าสู่หน้าสั่งอาหาร <i className="fa-solid fa-arrow-right ms-1"></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpModal {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
