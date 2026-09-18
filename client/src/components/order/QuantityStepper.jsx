import React from 'react';

export default function QuantityStepper({ quantity, onChangeQuantity }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-1" style={{ fontSize: '13.5px' }}>
        <i className="fa-solid fa-hashtag text-success"></i>
        <span>จำนวน (กล่อง / ห่อ):</span>
      </label>

      <div className="input-group shadow-sm" style={{ height: '46px' }}>
        <button
          type="button"
          className="btn btn-light border px-4 fw-bold fs-5 text-dark"
          onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        <input
          type="text"
          className="form-control text-center fw-bold fs-5 bg-white"
          value={quantity}
          readOnly
        />
        <button
          type="button"
          className="btn btn-light border px-4 fw-bold fs-5 text-dark"
          onClick={() => onChangeQuantity(Math.min(99, quantity + 1))}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  );
}
