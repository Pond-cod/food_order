import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function VisualMenuPicker({ menus, selectedMenu, onSelectMenu }) {
  if (!menus || menus.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-2 fw-semibold text-dark" style={{ fontSize: '13px' }}>
        <i className="fa-solid fa-fire text-warning"></i>
        <span>แตะเลือกเมนูจากภาพ:</span>
      </div>

      <div className="visual-menu-list">
        {menus.map((menu) => {
          const isSelected = selectedMenu && selectedMenu.name === menu.name;

          return (
            <div
              key={menu.id || menu.name}
              className={`visual-menu-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectMenu(menu)}
            >
              <div className="visual-card-img-wrap">
                {menu.imageUrl ? (
                  <img
                    src={menu.imageUrl}
                    alt={menu.name}
                    className="visual-card-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="visual-card-placeholder"><i class="fa-solid fa-bowl-food"></i></div>';
                    }}
                  />
                ) : (
                  <div className="visual-card-placeholder">
                    <i className="fa-solid fa-bowl-food"></i>
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '12px' }}>
                  {menu.name}
                </div>
                <div className="text-success fw-bold" style={{ fontSize: '13px' }}>
                  {formatCurrency(menu.price)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
