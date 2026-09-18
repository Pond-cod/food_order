import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function StickyBottomBar({
  cartItems = [],
  totalBoxes = 0,
  totalPrice = 0,
  onSubmit,
  isSubmitting,
}) {
  const hasItems = totalBoxes > 0;

  return (
    <div className="sticky-bottom-bar d-lg-none">
      <div className="container p-0">
        <div className="d-flex align-items-center justify-content-between gap-2">
          {/* Left: Cart Info or Prompt */}
          <div className="overflow-hidden flex-grow-1" style={{ maxWidth: '60%' }}>
            {hasItems ? (
              <div>
                <div className="d-flex align-items-center gap-1 text-dark fw-bold text-truncate" style={{ fontSize: '13px' }}>
                  <span className="badge bg-success rounded-pill px-2 py-0 me-1" style={{ fontSize: '11px' }}>
                    {totalBoxes} กล่อง
                  </span>
                  <span className="text-truncate">{cartItems.length} เมนูที่เลือก</span>
                </div>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <small className="text-muted" style={{ fontSize: '11px' }}>ยอดรวม:</small>
                  <span className="fw-bold text-success" style={{ fontSize: '17px', color: '#05A044' }}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-muted small d-flex align-items-center gap-1">
                <i className="fa-solid fa-hand-pointer text-warning"></i>
                <span style={{ fontSize: '12px' }}>แตะ + ที่เมนูด้านบน</span>
              </div>
            )}
          </div>

          {/* Right: CTA Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className="btn btn-order-submit rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2"
              style={{ fontSize: '13.5px' }}
              disabled={!hasItems || isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>กำลังส่ง...</span>
                </>
              ) : hasItems ? (
                <>
                  <i className="fa-solid fa-circle-check fs-6"></i>
                  <span>สั่งเลย ({formatCurrency(totalPrice)})</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-utensils fs-6"></i>
                  <span>เลือกเมนู</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
