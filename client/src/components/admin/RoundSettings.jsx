import React, { useState, useEffect } from 'react';

export default function RoundSettings({ currentRound, onSaveRound, isSaving }) {
  const [roundInput, setRoundInput] = useState('');

  useEffect(() => {
    setRoundInput(currentRound || '');
  }, [currentRound]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!roundInput.trim()) {
      alert('กรุณาระบุชื่อรอบ');
      return;
    }
    onSaveRound(roundInput.trim());
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mx-auto mb-4" style={{ maxWidth: '650px' }}>
      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="fa-regular fa-clock text-success"></i>
        <span>กำหนดรอบการสั่งอาหาร</span>
      </h5>

      {/* Current Round Banner */}
      <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3 mb-3">
        <small className="text-success fw-semibold d-block">รอบปัจจุบันที่แสดงให้ลูกค้า:</small>
        <div className="fs-5 fw-bold text-success mt-1">{currentRound || 'กำลังโหลด...'}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold text-dark" style={{ fontSize: '13.5px' }}>
            พิมพ์ชื่อรอบใหม่:
          </label>
          <input
            type="text"
            className="form-control py-2 shadow-sm rounded-3 fs-6"
            placeholder="เช่น รอบเที่ยง 17 ก.ย."
            value={roundInput}
            onChange={(e) => setRoundInput(e.target.value)}
            required
          />
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <small className="text-muted d-block mb-2" style={{ fontSize: '12px' }}>ปุ่มลัดเลือกด่วน:</small>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-light border text-dark fw-semibold px-3 py-1"
              onClick={() => setRoundInput('รอบเช้า')}
            >
              รอบเช้า
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border text-dark fw-semibold px-3 py-1"
              onClick={() => setRoundInput('รอบเที่ยง')}
            >
              รอบเที่ยง
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border text-dark fw-semibold px-3 py-1"
              onClick={() => setRoundInput('รอบเย็น')}
            >
              รอบเย็น
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border text-danger fw-semibold px-3 py-1"
              onClick={() => setRoundInput('🚫 ปิดรับออเดอร์ชั่วคราว')}
            >
              🚫 ปิดรับออเดอร์ชั่วคราว
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-success w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status"></span>
              <span>กำลังบันทึกรอบ...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk"></i>
              <span>บันทึกรอบการสั่งอาหาร</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
