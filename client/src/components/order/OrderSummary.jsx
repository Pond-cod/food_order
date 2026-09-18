import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function OrderSummary({ selectedMenu, quantity, onSubmit, isSubmitting }) {
  const unitPrice = selectedMenu ? selectedMenu.price : 0;
  const total = unitPrice * quantity;

  return (
    <div>
      {/* Receipt Breakdown Box */}
      <div className="card border-0 bg-light bg-opacity-75 p-3 rounded-4 mb-3">
        <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
          <span>เมนูที่เลือก</span>
          <strong className="text-dark text-truncate" style={{ maxWidth: '170px' }}>
            {selectedMenu ? selectedMenu.name : 'ยังไม่ได้เลือก'}
          </strong>
        </div>
        <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
          <span>ราคาต่อกล่อง</span>
          <span>{selectedMenu ? formatCurrency(unitPrice) : '-'}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
          <span>จำนวน</span>
          <span className="badge bg-white text-dark border px-2 py-1">{quantity} กล่อง</span>
        </div>
        <hr className="my-2 border-secondary border-opacity-25" />
        <div className="d-flex justify-content-between align-items-center pt-1">
          <span className="fw-bold text-dark fs-6">ยอดรวมทั้งหมด</span>
          <span className="fw-bold text-success fs-3 lh-1">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="btn btn-line w-100 py-3 rounded-4 shadow-sm d-flex align-items-center justify-content-center gap-2 fs-6 fw-bold"
        disabled={!selectedMenu || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status"></span>
            <span>กำลังส่งออเดอร์...</span>
          </>
        ) : selectedMenu ? (
          <>
            <i className="fa-solid fa-circle-check fs-5"></i>
            <span>ยืนยันสั่งอาหาร ({formatCurrency(total)})</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-hand-pointer"></i>
            <span>กรุณาแตะเลือกเมนูอาหาร</span>
          </>
        )}
      </button>
    </div>
  );
}
