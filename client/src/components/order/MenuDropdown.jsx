import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function MenuDropdown({ menus, selectedMenu, onChangeMenu }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '13.5px' }}>
          <i className="fa-solid fa-bowl-food text-success"></i>
          <span>เลือกเมนูอาหาร:</span>
        </label>
        {selectedMenu && (
          <span className="badge bg-success bg-opacity-10 text-success fw-bold" style={{ fontSize: '12px' }}>
            {formatCurrency(selectedMenu.price)} / จาน
          </span>
        )}
      </div>

      <select
        className="form-select py-2 shadow-sm rounded-3"
        value={selectedMenu ? selectedMenu.name : ''}
        onChange={(e) => {
          const found = menus.find((m) => m.name === e.target.value);
          onChangeMenu(found || null);
        }}
        style={{ fontSize: '14.5px' }}
      >
        <option value="">-- กรุณาเลือกรายการเมนู --</option>
        {menus.map((menu) => (
          <option key={menu.id || menu.name} value={menu.name}>
            {menu.name} - {formatCurrency(menu.price)}
          </option>
        ))}
      </select>
    </div>
  );
}
