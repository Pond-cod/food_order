import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function OrderSummary({
  cartItems = [],
  totalBoxes = 0,
  totalPrice = 0,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onToggleOption,
  onSubmit,
  isSubmitting,
}) {
  const hasItems = cartItems.length > 0;

  return (
    <div>
      {/* Cart Items List */}
      {hasItems ? (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-secondary small fw-semibold">
              รายการที่เลือก ({cartItems.length} เมนู):
            </span>
            {onClearCart && (
              <button
                type="button"
                className="btn btn-sm text-danger p-0 border-0"
                style={{ fontSize: '11px' }}
                onClick={onClearCart}
              >
                <i className="fa-regular fa-trash-can me-1"></i>
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="pe-1">
            {cartItems.map(({ menu, quantity, isExtra, hasEgg }) => {
              const unitPrice = (Number(menu.price) || 0) + (isExtra ? 10 : 0) + (hasEgg ? 10 : 0);
              const subtotal = unitPrice * quantity;

              return (
                <div key={menu.name} className="cart-summary-item shadow-sm">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                    <div>
                      <strong className="text-dark text-truncate d-block" style={{ fontSize: '13px', maxWidth: '170px' }}>
                        {menu.name}
                      </strong>
                      {(isExtra || hasEgg) && (
                        <div className="d-flex gap-1 mt-1">
                          {isExtra && (
                            <span className="badge bg-warning text-dark py-0 px-1" style={{ fontSize: '10px' }}>
                              ⭐ พิเศษ
                            </span>
                          )}
                          {hasEgg && (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success py-0 px-1" style={{ fontSize: '10px' }}>
                              🍳 +ไข่ดาว
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="fw-bold text-success" style={{ fontSize: '13.5px' }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted" style={{ fontSize: '11.5px' }}>
                      {formatCurrency(unitPrice)} / กล่อง
                    </small>

                    {/* Mini Stepper & Delete */}
                    <div className="d-flex align-items-center gap-1">
                      <div className="card-mini-stepper">
                        <button
                          type="button"
                          className="card-mini-stepper-btn minus"
                          onClick={() => onUpdateQuantity(menu.name, -1)}
                          title="ลดจำนวน"
                        >
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <span className="card-mini-stepper-count">{quantity}</span>
                        <button
                          type="button"
                          className="card-mini-stepper-btn plus"
                          onClick={() => onUpdateQuantity(menu.name, 1)}
                          title="เพิ่มจำนวน"
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>

                      {onRemoveItem && (
                        <button
                          type="button"
                          className="btn btn-sm text-muted p-1 border-0"
                          onClick={() => onRemoveItem(menu.name)}
                          title="ลบรายการนี้"
                        >
                          <i className="fa-solid fa-xmark text-danger" style={{ fontSize: '12px' }}></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Option Chips: พิเศษ (+10), เพิ่มไข่ดาว (+10) */}
                  <div className="cart-option-group pt-1 border-top border-light">
                    <button
                      type="button"
                      className={`cart-option-btn ${isExtra ? 'active' : ''}`}
                      onClick={() => onToggleOption && onToggleOption(menu.name, 'isExtra')}
                      title="สลับเป็น พิเศษ (+10 บาท)"
                    >
                      <span>{isExtra ? '✓ ⭐ พิเศษ' : '⭐ พิเศษ'}</span>
                      <span className="price-tag">+฿10</span>
                    </button>

                    <button
                      type="button"
                      className={`cart-option-btn ${hasEgg ? 'active' : ''}`}
                      onClick={() => onToggleOption && onToggleOption(menu.name, 'hasEgg')}
                      title="เพิ่มไข่ดาว (+10 บาท)"
                    >
                      <span>{hasEgg ? '✓ 🍳 +ไข่ดาว' : '🍳 +ไข่ดาว'}</span>
                      <span className="price-tag">+฿10</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div 
          className="rounded-4 p-3 text-center mb-3"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '2px dashed #F59E0B',
          }}
        >
          <div className="fs-3 mb-1">🍱 👈</div>
          <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>ยังไม่มีรายการในตะกร้า</div>
          <small className="text-secondary" style={{ fontSize: '11.5px' }}>แตะปุ่ม "+ เพิ่ม" ที่เมนูอาหารที่ต้องการสั่งได้เลยครับ</small>
        </div>
      )}

      {/* Receipt Breakdown Box */}
      <div 
        className="p-3 rounded-4 mb-3"
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: '1.5px solid #E2E8F0',
        }}
      >
        <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
          <span>จำนวนรายการ</span>
          <strong className="text-dark">
            {cartItems.length} รายการ
          </strong>
        </div>
        <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
          <span>จำนวนกล่องรวม</span>
          <span className="badge bg-white text-success border border-success border-opacity-25 px-2 py-1 fw-bold">
            {totalBoxes} กล่อง
          </span>
        </div>
        <hr className="my-2" style={{ borderColor: '#CBD5E1', borderStyle: 'dashed' }} />
        <div className="d-flex justify-content-between align-items-center pt-1">
          <span className="fw-bold text-dark fs-6">ยอดรวมทั้งหมด</span>
          <span className="fw-bold text-success fs-3 lh-1" style={{ color: '#05A044' }}>
            {formatCurrency(totalPrice)}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="btn btn-order-submit w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 fs-6"
        disabled={!hasItems || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status"></span>
            <span>กำลังส่งออเดอร์...</span>
          </>
        ) : hasItems ? (
          <>
            <i className="fa-solid fa-circle-check fs-5"></i>
            <span>ยืนยันสั่งอาหาร ({formatCurrency(totalPrice)})</span>
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
