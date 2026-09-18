import React from 'react';

export default function QuantityStepper({ quantity, onChangeQuantity }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-0" style={{ fontSize: '13px' }}>
          <span 
            className="rounded-2 d-flex align-items-center justify-content-center text-white" 
            style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #10B981, #059669)', fontSize: '11px' }}
          >
            <i className="fa-solid fa-boxes-stacked"></i>
          </span>
          <span>จำนวนที่ต้องการสั่ง:</span>
        </label>
        
        {/* Quick Presets with Vibrant Styling */}
        <div className="d-flex gap-1">
          {[1, 2, 3, 5].map((num) => (
            <button
              key={num}
              type="button"
              className={`btn btn-sm py-0 px-2 rounded-pill fw-bold ${
                quantity === num 
                  ? 'text-white shadow-sm' 
                  : 'bg-light border text-secondary'
              }`}
              style={{ 
                fontSize: '11px', 
                height: '24px',
                background: quantity === num ? 'linear-gradient(135deg, #06C755, #05A044)' : undefined,
                border: quantity === num ? 'none' : undefined,
              }}
              onClick={() => onChangeQuantity(num)}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="d-flex align-items-center justify-content-center gap-3 p-2 rounded-4 border"
        style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}
      >
        <button
          type="button"
          className="touch-stepper-btn touch-stepper-btn-minus shadow-sm"
          disabled={quantity <= 1}
          onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
          title="ลดจำนวน"
        >
          <i className="fa-solid fa-minus fs-6"></i>
        </button>

        <div className="text-center" style={{ minWidth: '70px' }}>
          <span className="fw-bold fs-3 text-dark lh-1 d-block">{quantity}</span>
          <small className="d-block text-secondary fw-semibold" style={{ fontSize: '11px' }}>กล่อง</small>
        </div>

        <button
          type="button"
          className="touch-stepper-btn touch-stepper-btn-plus shadow-sm"
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
