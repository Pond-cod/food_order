import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function StickyBottomBar({
  selectedMenu,
  quantity = 1,
  onSubmit,
  isSubmitting,
  onOpenDrawer,
}) {
  const unitPrice = selectedMenu ? Number(selectedMenu.price) || 0 : 0;
  const total = unitPrice * quantity;

  return (
    <div className="sticky-bottom-bar d-lg-none">
      <div className="container p-0">
        <div className="d-flex align-items-center justify-content-between gap-2">
          {/* Left: Selected Menu Info or Prompt */}
          <div className="overflow-hidden flex-grow-1" style={{ maxWidth: '60%' }}>
            {selectedMenu ? (
              <div>
                <div className="d-flex align-items-center gap-1 text-dark fw-bold text-truncate" style={{ fontSize: '13.5px' }}>
                  <span className="badge bg-success rounded-pill px-2 py-0 me-1" style={{ fontSize: '11px' }}>
                    x{quantity}
                  </span>
                  <span className="text-truncate">{selectedMenu.name}</span>
                </div>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <small className="text-muted" style={{ fontSize: '11px' }}>รวมทั้งสิ้น:</small>
                  <span className="fw-bold text-success" style={{ fontSize: '16px' }}>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-muted small d-flex align-items-center gap-1">
                <i className="fa-solid fa-hand-pointer text-warning"></i>
                <span style={{ fontSize: '12.5px' }}>แตะเลือกเมนูด้านบน</span>
              </div>
            )}
          </div>

          {/* Right: CTA Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className="btn btn-line rounded-pill px-3 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
              style={{ fontSize: '14px' }}
              disabled={!selectedMenu || isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>กำลังส่ง...</span>
                </>
              ) : selectedMenu ? (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>สั่งเลย ({formatCurrency(total)})</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bowl-food"></i>
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
