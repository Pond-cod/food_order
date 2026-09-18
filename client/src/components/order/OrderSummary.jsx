import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function OrderSummary({ selectedMenu, quantity, onSubmit, isSubmitting }) {
  const unitPrice = selectedMenu ? selectedMenu.price : 0;
  const total = unitPrice * quantity;

  return (
    <div>
      {/* Summary Box */}
      <div className="card border border-dashed bg-light p-3 rounded-4 mb-3">
        <div className="d-flex justify-content-between text-muted small mb-1">
          <span>ราคาต่อหน่วย</span>
          <span>{selectedMenu ? formatCurrency(unitPrice) : '-'}</span>
        </div>
        <div className="d-flex justify-content-between text-muted small mb-2">
          <span>จำนวน</span>
          <span>{quantity} รายการ</span>
        </div>
        <hr className="my-1 text-secondary" />
        <div className="d-flex justify-content-between align-items-center pt-1">
          <span className="fw-bold text-dark fs-6">ยอดรวมทั้งสิ้น</span>
          <span className="fw-bold text-success fs-4">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="btn btn-line w-100 py-3 rounded-4 shadow d-flex align-items-center justify-content-center gap-2 fs-6"
        disabled={!selectedMenu || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status"></span>
            <span>กำลังบันทึกออเดอร์...</span>
          </>
        ) : selectedMenu ? (
          <>
            <i className="fa-solid fa-cart-shopping"></i>
            <span>ยืนยันการสั่งอาหาร ({formatCurrency(total)})</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-cart-shopping"></i>
            <span>กรุณาเลือกเมนูอาหาร</span>
          </>
        )}
      </button>
    </div>
  );
}
