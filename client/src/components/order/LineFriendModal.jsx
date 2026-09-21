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
      className="line-modal-overlay"
      onClick={handleClose}
    >
      {/* Dynamic Colorful Glow Behind Modal */}
      <div className="line-modal-glow-rainbow"></div>

      <div 
        className="line-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colorful Gradient Header */}
        <div className="line-modal-header">
          {/* Close Button */}
          <button 
            type="button" 
            className="line-modal-close"
            onClick={handleClose}
            aria-label="Close"
            title="ปิดหน้าต่าง"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* Floating LINE Logo */}
          <div className="header-badge-row">
            <div className="line-avatar-badge">
              <i className="fa-brands fa-line"></i>
            </div>
          </div>

          <h3 className="modal-main-title">
            เพิ่มเพื่อน LINE เพื่อไม่พลาดออเดอร์
          </h3>
          <p className="modal-main-desc">
            รับใบเสร็จทันที • รู้คิวปรุงเสร็จ • อาหารพร้อมเสิร์ฟถึงโต๊ะ
          </p>

          {/* 3 Colorful Pillars with Distinct Colors */}
          <div className="colorful-pillars-grid">
            {/* Pillar 1: Orange/Amber */}
            <div className="pillar-card pillar-orange">
              <div className="pillar-badge badge-orange">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div className="pillar-text">
                <strong>ใบเสร็จเข้าแชท</strong>
                <small>ยืนยันออเดอร์ทันที</small>
              </div>
            </div>

            {/* Pillar 2: Mint/Green */}
            <div className="pillar-card pillar-green">
              <div className="pillar-badge badge-green">
                <i className="fa-solid fa-kitchen-set"></i>
              </div>
              <div className="pillar-text">
                <strong>เตือนเมื่อปรุงเสร็จ</strong>
                <small>อาหารพร้อมรับประทาน</small>
              </div>
            </div>

            {/* Pillar 3: Blue/Sky */}
            <div className="pillar-card pillar-blue">
              <div className="pillar-badge badge-blue">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="pillar-text">
                <strong>สั่งง่าย 1 คลิก</strong>
                <small>สั่งซ้ำได้สะดวกรวดเร็ว</small>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Clean, Direct & Easy */}
        <div className="line-modal-body">
          {/* Method 1: Single Prominent Add Friend CTA */}
          <div className="add-friend-primary-section">
            <a 
              href={LINE_ADD_FRIEND_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="colorful-line-button"
            >
              <div className="btn-line-icon">
                <i className="fa-brands fa-line"></i>
              </div>
              <div className="btn-line-content">
                <span className="btn-line-title">กดเพิ่มเพื่อน LINE ทันที</span>
                <span className="btn-line-sub">แตะเพื่อเปิดแอปและรับแจ้งเตือน</span>
              </div>
              <i className="fa-solid fa-arrow-right btn-line-arrow"></i>
            </a>
          </div>

          {/* Clean Divider */}
          <div className="colorful-divider">
            <span className="divider-line left"></span>
            <span className="divider-badge">หรือ สแกน QR Code</span>
            <span className="divider-line right"></span>
          </div>

          {/* Method 2: Framed QR Code */}
          <div className="qr-highlight-box">
            <div className="qr-white-card">
              <img 
                src={LINE_QR_CODE} 
                alt="LINE OA QR Code" 
                className="qr-img-fluid"
              />
            </div>
            <div className="qr-hint-text">
              เปิดกล้องมือถือ หรือแอป LINE เพื่อสแกน
            </div>
          </div>

          {/* Footer Controls: Checkbox & Enter Button */}
          <div className="modal-footer-section">
            <label className="friendly-checkbox">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span className="checkbox-box"></span>
              <span className="checkbox-label-text">ไม่ต้องแสดงหน้านี้อีกในครั้งต่อไป</span>
            </label>

            <button 
              type="button" 
              className="enter-store-btn"
              onClick={handleClose}
            >
              <span>เข้าสู่หน้าสั่งอาหาร</span>
              <i className="fa-solid fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded High-Aesthetic Colorful CSS */}
      <style>{`
        .line-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          animation: fadeInFast 0.25s ease-out;
        }

        .line-modal-glow-rainbow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }

        .line-modal-card {
          position: relative;
          background: #FFFFFF;
          border-radius: 26px;
          width: 100%;
          max-width: 430px;
          max-height: 94vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px -12px rgba(6, 199, 85, 0.28), 0 12px 32px -4px rgba(0, 0, 0, 0.16);
          border: 2px solid rgba(255, 255, 255, 0.9);
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Custom Scrollbar for small mobile screens */
        .line-modal-card::-webkit-scrollbar {
          width: 5px;
        }
        .line-modal-card::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 10px;
        }

        /* Header */
        .line-modal-header {
          position: relative;
          background: linear-gradient(135deg, #059669 0%, #06C755 45%, #10B981 80%, #047857 100%);
          color: #FFFFFF;
          padding: 22px 18px 18px;
          text-align: center;
          overflow: hidden;
        }

        .line-modal-header::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 130px;
          height: 130px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .line-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #FFFFFF;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .line-modal-close:hover {
          background: rgba(255, 255, 255, 0.45);
          transform: rotate(90deg) scale(1.08);
        }

        .header-badge-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .line-avatar-badge {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #06C755;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
          border: 3px solid rgba(255, 255, 255, 0.9);
        }

        .modal-main-title {
          font-size: 18.5px;
          font-weight: 700;
          margin-bottom: 3px;
          letter-spacing: -0.2px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .modal-main-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.92);
          margin-bottom: 12px;
          font-weight: 400;
        }

        /* 3 Colorful Pillars */
        .colorful-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .pillar-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 8px 4px 6px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          border: 1.5px solid transparent;
          transition: transform 0.2s ease;
        }

        .pillar-card:hover {
          transform: translateY(-2px);
        }

        .pillar-orange {
          border-color: #FED7AA;
          background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%);
        }

        .pillar-green {
          border-color: #A7F3D0;
          background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%);
        }

        .pillar-blue {
          border-color: #BAE6FD;
          background: linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%);
        }

        .pillar-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          margin: 0 auto 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .badge-orange {
          background: #FFEDD5;
          color: #EA580C;
        }

        .badge-green {
          background: #DCFCE7;
          color: #16A34A;
        }

        .badge-blue {
          background: #E0F2FE;
          color: #0284C7;
        }

        .pillar-text strong {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.2;
        }

        .pillar-text small {
          display: block;
          font-size: 9.5px;
          color: #64748B;
          line-height: 1.1;
          margin-top: 1px;
        }

        /* Body */
        .line-modal-body {
          padding: 18px 18px 20px;
        }

        .add-friend-primary-section {
          margin-bottom: 12px;
        }

        .colorful-line-button {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #06C755 0%, #00B900 60%, #059669 100%);
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: 0 8px 22px rgba(6, 199, 85, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }

        .colorful-line-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: shineGleam 3.5s infinite;
        }

        .colorful-line-button:hover {
          color: #FFFFFF;
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 12px 28px rgba(6, 199, 85, 0.5);
        }

        .btn-line-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #FFFFFF;
          color: #06C755;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        }

        .btn-line-content {
          flex-grow: 1;
          text-align: left;
        }

        .btn-line-title {
          display: block;
          font-size: 15.5px;
          font-weight: 700;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .btn-line-sub {
          display: block;
          font-size: 11.5px;
          color: #E8F8EE;
          margin-top: 2px;
        }

        .btn-line-arrow {
          font-size: 15px;
          opacity: 0.9;
          transition: transform 0.2s ease;
        }

        .colorful-line-button:hover .btn-line-arrow {
          transform: translateX(4px);
        }

        /* Divider */
        .colorful-divider {
          display: flex;
          align-items: center;
          margin: 12px 0;
        }

        .divider-line {
          flex-grow: 1;
          height: 1.5px;
          background: linear-gradient(90deg, #E2E8F0, #CBD5E1);
        }

        .divider-badge {
          padding: 0 10px;
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* QR Frame */
        .qr-highlight-box {
          text-align: center;
          margin-bottom: 12px;
        }

        .qr-white-card {
          display: inline-block;
          padding: 8px;
          background: #FFFFFF;
          border-radius: 16px;
          border: 2px solid #E2E8F0;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .qr-white-card::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 18px;
          background: linear-gradient(135deg, #06C755 0%, #F59E0B 100%);
          z-index: -1;
          opacity: 0.5;
        }

        .qr-img-fluid {
          width: 140px;
          height: 140px;
          display: block;
          border-radius: 10px;
        }

        .qr-hint-text {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 6px;
          font-weight: 500;
        }

        /* Footer Section */
        .modal-footer-section {
          border-top: 1px dashed #E2E8F0;
          padding-top: 12px;
        }

        .friendly-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          user-select: none;
        }

        .friendly-checkbox input {
          display: none;
        }

        .checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 2px solid #CBD5E1;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .friendly-checkbox input:checked + .checkbox-box {
          background: #06C755;
          border-color: #06C755;
        }

        .friendly-checkbox input:checked + .checkbox-box::after {
          content: '✓';
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
        }

        .checkbox-label-text {
          font-size: 12px;
          color: #64748B;
        }

        /* Enter Store Button */
        .enter-store-btn {
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
          color: #1E293B;
          border: 1.5px solid #CBD5E1;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .enter-store-btn:hover {
          background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
          color: #0F172A;
          border-color: #94A3B8;
          transform: translateY(-1px);
        }

        /* Animations */
        @keyframes fadeInFast {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.88) translateY(14px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes shineGleam {
          0% { left: -100%; }
          30% { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
