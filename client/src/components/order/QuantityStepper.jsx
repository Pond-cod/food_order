import React from 'react';

export default function QuantityStepper({ quantity, onChangeQuantity }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-0" style={{ fontSize: '13px' }}>
          <i className="fa-solid fa-boxes-stacked text-success"></i>
          <span>จำนวนที่ต้องการสั่ง:</span>
        </label>
        
        {/* Quick Presets */}
        <div className="d-flex gap-1">
          {[1, 2, 3, 5].map((num) => (
            <button
              key={num}
              type="button"
              className={`btn btn-sm py-0 px-2 rounded-pill fw-semibold ${
                quantity === num ? 'btn-success text-white' : 'btn-light border text-secondary'
              }`}
              style={{ fontSize: '11px', height: '24px' }}
              onClick={() => onChangeQuantity(num)}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-center gap-3 bg-light bg-opacity-75 p-2 rounded-3 border">
        <button
          type="button"
          className="touch-stepper-btn shadow-sm"
          disabled={quantity <= 1}
          onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
          title="ลดจำนวน"
        >
          <i className="fa-solid fa-minus fs-6"></i>
        </button>

        <div className="text-center" style={{ minWidth: '60px' }}>
          <span className="fw-bold fs-4 text-dark lh-1">{quantity}</span>
          <small className="d-block text-muted" style={{ fontSize: '11px' }}>กล่อง</small>
        </div>

        <button
          type="button"
          className="touch-stepper-btn shadow-sm"
          disabled={quantity >= 99}
          onClick={() => onChangeQuantity(Math.min(99, quantity + 1))}
          title="เพิ่มจำนวน"
        >
          <i className="fa-solid fa-plus fs-6"></i>
        </button>
      </div>
    </div>
  );
}
