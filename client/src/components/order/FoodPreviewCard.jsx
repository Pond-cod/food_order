import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function FoodPreviewCard({ selectedMenu }) {
  if (!selectedMenu || !selectedMenu.imageUrl) return null;

  return (
    <div className="food-preview-card">
      <div className="food-preview-img-wrapper">
        <img
          src={selectedMenu.imageUrl}
          alt={selectedMenu.name}
          className="food-preview-img"
          onError={(e) => {
            e.target.parentElement.style.display = 'none';
          }}
        />
        <div className="food-preview-price-tag">
          {formatCurrency(selectedMenu.price)}
        </div>
      </div>
      <div className="food-preview-info">
        <div className="food-preview-name">{selectedMenu.name}</div>
        <div className="food-preview-status">
          <i className="fa-solid fa-circle-check"></i>
          <span>พร้อมสั่งปรุงสดใหม่</span>
        </div>
      </div>
    </div>
  );
}
