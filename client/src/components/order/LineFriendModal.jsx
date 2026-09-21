import React, { useState, useEffect } from 'react';
import { LINE_ADD_FRIEND_URL, LINE_ADD_FRIEND_BTN_IMG, LINE_QR_CODE } from '../../utils/assets';

export default function LineFriendModal({ isOpen, onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  // ตรวจสอบขนาดหน้าจอ: หากเป็นมือถือให้เริ่มที่แท็บปุ่มแตะ, หากเป็นจอคอมให้เริ่มที่แท็บ QR Code
  const [activeTab, setActiveTab] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768 ? 'button' : 'qr';
  });

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
      {/* Ambient Glow Background */}
      <div className="line-modal-glow"></div>

      <div 
        className="line-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero */}
        <div className="line-modal-header">
          {/* Close Button */}
          <button 
            type="button" 
            className="line-modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* Floating Line Badge */}
          <div className="line-badge-wrapper">
            <div className="line-badge-pulse"></div>
            <div className="line-badge-icon">
              <i className="fa-brands fa-line"></i>
            </div>
          </div>

          <div className="line-pill-tag">
            <span className="sparkle">✨</span> LINE Official Account
          </div>
          <h3 className="line-modal-title">เพิ่มเพื่อนเพื่อรับการแจ้งเตือน</h3>
          <p className="line-modal-subtitle">
            รับใบเสร็จ • อัปเดตสถานะปรุงเสร็จ • สั่งอาหารสะดวก
          </p>

          {/* 3 Value Pillars */}
          <div className="line-pillars-row">
            <div className="line-pillar-item">
              <div className="pillar-icon"><i className="fa-solid fa-receipt"></i></div>
              <span>ใบเสร็จเข้าแชท</span>
            </div>
            <div className="line-pillar-item">
              <div className="pillar-icon"><i className="fa-solid fa-bell"></i></div>
              <span>แจ้งเตือนอาหารเสร็จ</span>
            </div>
            <div className="line-pillar-item">
              <div className="pillar-icon"><i className="fa-solid fa-bolt"></i></div>
              <span>สั่งง่ายใน 1 คลิก</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="line-modal-body">
          {/* Segmented Tab Switcher */}
          <div className="line-tab-switcher">
            <button
              type="button"
              className={`line-tab-btn ${activeTab === 'button' ? 'active' : ''}`}
              onClick={() => setActiveTab('button')}
            >
              <i className="fa-solid fa-mobile-screen-button me-1"></i> แตะเพิ่มเพื่อน
            </button>
            <button
              type="button"
              className={`line-tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr')}
            >
              <i className="fa-solid fa-qrcode me-1"></i> สแกน QR Code
            </button>
          </div>

          {/* Tab Content 1: Direct Button (Mobile Optimized) */}
          {activeTab === 'button' && (
            <div className="tab-pane-fade">
              <div className="cta-box">
                <p className="cta-lead">แตะปุ่มสีเขียวด้านล่างเพื่อเปิดแอป LINE ทันที</p>
                
                <a 
                  href={LINE_ADD_FRIEND_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="line-primary-cta"
                >
                  <div className="cta-icon-box">
                    <i className="fa-brands fa-line"></i>
                  </div>
                  <div className="cta-text-box">
                    <span className="cta-title">เพิ่มเพื่อน LINE OA</span>
                    <span className="cta-desc">แตะเพื่อเปิดแอปและกดเพิ่มเพื่อน</span>
                  </div>
                  <i className="fa-solid fa-chevron-right cta-arrow"></i>
                </a>

                <div className="mt-3">
                  <span className="text-muted small">หรือแตะปุ่มทางการของ LINE:</span>
                  <div className="mt-1">
                    <a 
                      href={LINE_ADD_FRIEND_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="d-inline-block hover-lift"
                    >
                      <img 
                        src={LINE_ADD_FRIEND_BTN_IMG} 
                        alt="เพิ่มเพื่อน" 
                        height="38" 
                        border="0" 
                        style={{ borderRadius: '6px', boxShadow: '0 4px 12px rgba(6, 199, 85, 0.25)' }}
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: QR Code Scan */}
          {activeTab === 'qr' && (
            <div className="tab-pane-fade">
              <div className="qr-container-outer">
                {/* Viewfinder Frame with Scanner Brackets */}
                <div className="viewfinder-frame">
                  <span className="corner corner-tl"></span>
                  <span className="corner corner-tr"></span>
                  <span className="corner corner-bl"></span>
                  <span className="corner corner-br"></span>
                  
                  <div className="qr-image-wrapper">
                    <img 
                      src={LINE_QR_CODE} 
                      alt="LINE QR Code" 
                      className="qr-image" 
                    />
                  </div>
                </div>

                <div className="qr-instruction">
                  <i className="fa-solid fa-camera text-success me-1"></i>
                  <span>เปิดกล้องมือถือ หรือ แอป LINE แล้วสแกนภาพนี้</span>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox: Don't show again */}
          <div className="dont-show-container">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                className="checkbox-input"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">ไม่ต้องแสดงหน้านี้อีกในครั้งถัดไป</span>
            </label>
          </div>

          {/* Enter Order Page Button */}
          <button 
            type="button" 
            className="enter-order-btn"
            onClick={handleClose}
          >
            <span>เข้าสู่หน้าสั่งอาหาร</span>
            <i className="fa-solid fa-arrow-right enter-arrow"></i>
          </button>
        </div>
      </div>

      <style>{`
        .line-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: overlayFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .line-modal-glow {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 199, 85, 0.28) 0%, rgba(6, 199, 85, 0) 70%);
          filter: blur(40px);
          pointer-events: none;
          animation: pulseGlow 4s ease-in-out infinite alternate;
        }

        .line-modal-card {
          position: relative;
          background: #FFFFFF;
          border-radius: 28px;
          width: 100%;
          max-width: 440px;
          overflow: hidden;
          box-shadow: 0 25px 60px -12px rgba(6, 199, 85, 0.25), 0 12px 36px -8px rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.8);
          animation: modalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .line-modal-header {
          position: relative;
          background: linear-gradient(145deg, #049743 0%, #06C755 50%, #10B981 100%);
          color: #FFFFFF;
          padding: 24px 20px 20px;
          text-align: center;
          overflow: hidden;
        }

        .line-modal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 10%, transparent 60%);
          pointer-events: none;
        }

        .line-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.35);
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
          background: rgba(255, 255, 255, 0.4);
          transform: rotate(90deg) scale(1.05);
        }

        .line-badge-wrapper {
          position: relative;
          width: 58px;
          height: 58px;
          margin: 0 auto 10px;
        }

        .line-badge-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          animation: badgePulse 2s infinite;
        }

        .line-badge-icon {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #FFFFFF;
          color: #06C755;
          font-size: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .line-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.35);
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
        }

        .line-modal-title {
          font-size: 19px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        }

        .line-modal-subtitle {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 14px;
          font-weight: 400;
        }

        .line-pillars-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-top: 6px;
        }

        .line-pillar-item {
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          padding: 8px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pillar-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #FFFFFF;
        }

        .line-pillar-item span {
          font-size: 10.5px;
          font-weight: 600;
          line-height: 1.2;
          color: #FFFFFF;
        }

        /* Modal Body */
        .line-modal-body {
          padding: 20px 22px 22px;
          text-align: center;
        }

        .line-tab-switcher {
          display: flex;
          background: #F1F5F9;
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 18px;
          border: 1px solid #E2E8F0;
        }

        .line-tab-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          background: transparent;
          color: #64748B;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .line-tab-btn.active {
          background: #FFFFFF;
          color: #06C755;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .tab-pane-fade {
          animation: tabFadeIn 0.25s ease-out;
        }

        .cta-box {
          padding: 4px 0 10px;
        }

        .cta-lead {
          font-size: 13px;
          color: #475569;
          font-weight: 500;
          margin-bottom: 14px;
        }

        .line-primary-cta {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #06C755 0%, #05A044 100%);
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(6, 199, 85, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
        }

        .line-primary-cta:hover {
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(6, 199, 85, 0.45);
        }

        .cta-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }

        .cta-text-box {
          flex-grow: 1;
          text-align: left;
        }

        .cta-title {
          display: block;
          font-size: 15.5px;
          font-weight: 700;
          line-height: 1.2;
        }

        .cta-desc {
          display: block;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.85);
          margin-top: 2px;
        }

        .cta-arrow {
          font-size: 14px;
          opacity: 0.8;
          transition: transform 0.2s ease;
        }

        .line-primary-cta:hover .cta-arrow {
          transform: translateX(3px);
          opacity: 1;
        }

        /* QR Frame */
        .qr-container-outer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 0 6px;
        }

        .viewfinder-frame {
          position: relative;
          padding: 14px;
          background: #FFFFFF;
          border-radius: 20px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
          border: 1.5px solid #E2E8F0;
          display: inline-block;
        }

        .corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: #06C755;
          border-style: solid;
          border-width: 0;
          pointer-events: none;
        }

        .corner-tl {
          top: 6px;
          left: 6px;
          border-top-width: 3px;
          border-left-width: 3px;
          border-top-left-radius: 8px;
        }

        .corner-tr {
          top: 6px;
          right: 6px;
          border-top-width: 3px;
          border-right-width: 3px;
          border-top-right-radius: 8px;
        }

        .corner-bl {
          bottom: 6px;
          left: 6px;
          border-bottom-width: 3px;
          border-left-width: 3px;
          border-bottom-left-radius: 8px;
        }

        .corner-br {
          bottom: 6px;
          right: 6px;
          border-bottom-width: 3px;
          border-right-width: 3px;
          border-bottom-right-radius: 8px;
        }

        .qr-image-wrapper {
          border-radius: 12px;
          overflow: hidden;
        }

        .qr-image {
          width: 165px;
          height: 165px;
          display: block;
        }

        .qr-instruction {
          font-size: 12px;
          color: #64748B;
          margin-top: 10px;
          font-weight: 500;
        }

        /* Checkbox */
        .dont-show-container {
          margin: 16px 0 14px;
          display: flex;
          justify-content: center;
        }

        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1.5px solid #CBD5E1;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #06C755;
          border-color: #06C755;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
        }

        .checkbox-text {
          font-size: 12.5px;
          color: #64748B;
        }

        /* Enter Order Page Button */
        .enter-order-btn {
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          background: #F8FAFC;
          color: #334155;
          border: 1.5px solid #E2E8F0;
          font-size: 14.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .enter-order-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .enter-order-btn:hover .enter-arrow {
          transform: translateX(4px);
        }

        .enter-arrow {
          transition: transform 0.2s ease;
          font-size: 13px;
        }

        /* Hover Lift Helper */
        .hover-lift {
          transition: transform 0.15s ease;
        }
        .hover-lift:hover {
          transform: scale(1.05);
        }

        /* Animations */
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScaleUp {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes badgePulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.6; }
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
