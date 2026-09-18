import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function FoodCatalogGrid({
  menus = [],
  selectedMenu,
  onSelectMenu,
  onZoomImage,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenus = menus.filter((m) =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="mb-4">
      {/* Search & Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5">🍱</span>
          <h5 className="fw-bold text-dark mb-0">รายการอาหารเปิดสั่ง</h5>
          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2">
            {menus.length} เมนู
          </span>
        </div>

        {/* Quick Search */}
        <div className="position-relative" style={{ minWidth: '180px', maxWidth: '240px' }}>
          <input
            type="text"
            className="form-control form-control-sm ps-4 rounded-pill bg-white shadow-sm border-1"
            placeholder="ค้นหาเมนู..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i
            className="fa-solid fa-magnifying-glass position-absolute text-muted"
            style={{ left: '12px', top: '9px', fontSize: '11px' }}
          ></i>
          {searchTerm && (
            <button
              type="button"
              className="btn btn-sm position-absolute end-0 top-0 text-muted p-1 me-1 border-0"
              onClick={() => setSearchTerm('')}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Food Cards */}
      {filteredMenus.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <div className="display-6 text-muted mb-2">🍽️</div>
          <h6 className="fw-bold text-secondary">ไม่พบรายการอาหารตามคำค้นหา</h6>
          <small className="text-muted">ลองค้นหาด้วยคำอื่น หรือล้างช่องค้นหา</small>
        </div>
      ) : (
        <div className="food-grid">
          {filteredMenus.map((menu) => {
            const isSelected = selectedMenu && (selectedMenu.rowIndex === menu.rowIndex || selectedMenu.name === menu.name);
            const isSoldOut = (menu.status || '').toLowerCase() === 'sold out' || menu.status === 'ปิดขาย';

            return (
              <div
                key={menu.rowIndex || menu.name}
                className={`food-card-modern ${isSelected ? 'selected' : ''} ${isSoldOut ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (!isSoldOut) {
                    onSelectMenu(menu);
                  }
                }}
              >
                {/* Food Image */}
                <div className="food-card-img-wrap">
                  {menu.imageUrl ? (
                    <img
                      src={menu.imageUrl}
                      alt={menu.name}
                      className="food-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                          e.target.parentElement.innerHTML = `
                            <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted bg-light">
                              <i class="fa-solid fa-bowl-food fs-3 mb-1 text-secondary opacity-50"></i>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted bg-light">
                      <i className="fa-solid fa-bowl-food fs-3 mb-1 text-secondary opacity-50"></i>
                    </div>
                  )}

                  {/* Price Tag Pill */}
                  <div className="food-card-price-pill">
                    ฿{Number(menu.price).toLocaleString()}
                  </div>

                  {/* Selected Checkmark Badge */}
                  {isSelected && (
                    <div className="food-card-badge-selected" title="เลือกเมนูนี้แล้ว">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}

                  {/* Sold out overlay */}
                  {isSoldOut && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
                      style={{ backdropFilter: 'blur(2px)' }}
                    >
                      <span className="badge bg-danger text-white rounded-pill px-2 py-1 shadow" style={{ fontSize: '11px' }}>
                        🚫 หมดชั่วคราว
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-2 p-sm-3 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <h6 className="fw-bold text-dark mb-1 text-truncate" title={menu.name} style={{ fontSize: '13.5px' }}>
                      {menu.name}
                    </h6>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top border-light">
                    <span className="fw-bold text-success" style={{ fontSize: '14px' }}>
                      {formatCurrency(menu.price)}
                    </span>

                    {isSoldOut ? (
                      <span className="badge bg-secondary opacity-75" style={{ fontSize: '10px' }}>
                        ปิดขาย
                      </span>
                    ) : isSelected ? (
                      <span className="badge bg-success text-white rounded-pill px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                        <i className="fa-solid fa-check" style={{ fontSize: '9px' }}></i>
                        <span>เลือกแล้ว</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border text-success rounded-pill px-2 py-0 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                        style={{ fontSize: '11px', height: '26px' }}
                      >
                        <i className="fa-solid fa-plus" style={{ fontSize: '9px' }}></i>
                        <span>เลือก</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
