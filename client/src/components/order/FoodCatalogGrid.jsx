import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

function FoodCardImage({ menu }) {
  const [hasError, setHasError] = React.useState(false);

  if (!menu.imageUrl || hasError) {
    return (
      <div className="food-placeholder-warm">
        <div className="food-placeholder-icon-wrap">
          <span>🍲</span>
        </div>
        <small className="fw-bold" style={{ fontSize: '11px', color: '#D97706' }}>
          เมนูอร่อย
        </small>
      </div>
    );
  }

  return (
    <img
      src={menu.imageUrl}
      alt={menu.name}
      className="food-card-img"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export default function FoodCatalogGrid({
  menus = [],
  cart = {},
  onAddToCart,
  onUpdateQuantity,
  onToggleOption,
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
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm"
            style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #FF6B35, #F59E0B)' }}
          >
            <i className="fa-solid fa-utensils" style={{ fontSize: '14px' }}></i>
          </div>
          <h5 className="fw-bold text-dark mb-0">รายการอาหารเปิดสั่ง</h5>
          <span 
            className="badge rounded-pill px-2 py-1 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', fontSize: '11px' }}
          >
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
          {filteredMenus.map((menu, idx) => {
            const cartKey = String(menu.id || menu.name || 'unknown');
            const cartItem = cart[cartKey];
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            const isInCart = quantityInCart > 0;
            const isSoldOut = (menu.status || '').toLowerCase() === 'sold out' || menu.status === 'ปิดขาย';

            return (
              <div
                key={menu.id || menu.name || idx}
                className={`food-card-modern ${isInCart ? 'selected' : ''} ${isSoldOut ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (!isSoldOut && !isInCart) {
                    onAddToCart(menu);
                  }
                }}
              >
                {/* Food Image */}
                <div className="food-card-img-wrap">
                  <FoodCardImage menu={menu} />

                  {/* Price Tag Pill */}
                  <div className="food-card-price-pill">
                    ฿{Number(menu.price).toLocaleString()}
                  </div>

                  {/* Count in Cart Badge */}
                  {isInCart && (
                    <div className="food-card-badge-selected" title={`ในตะกร้า ${quantityInCart} กล่อง`}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>x{quantityInCart}</span>
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
                      {formatCurrency(
                        (Number(menu.price) || 0) +
                        (cartItem?.isExtra ? 10 : 0) +
                        (cartItem?.hasEgg ? 10 : 0)
                      )}
                    </span>

                    {isSoldOut ? (
                      <span className="badge bg-secondary opacity-75" style={{ fontSize: '10px' }}>
                        ปิดขาย
                      </span>
                    ) : isInCart ? (
                      <div 
                        className="card-mini-stepper shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="card-mini-stepper-btn minus"
                          onClick={() => onUpdateQuantity(cartKey, -1)}
                          title="ลดจำนวน"
                        >
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <span className="card-mini-stepper-count">{quantityInCart}</span>
                        <button
                          type="button"
                          className="card-mini-stepper-btn plus"
                          onClick={() => onUpdateQuantity(cartKey, 1)}
                          title="เพิ่มจำนวน"
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-select-food shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(menu);
                        }}
                      >
                        <i className="fa-solid fa-plus" style={{ fontSize: '9px' }}></i>
                        <span>เพิ่ม</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Mini Option Chips when selected in cart */}
                  {isInCart && (
                    <div className="card-mini-options mt-2 pt-1 border-top border-light" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`card-mini-option-btn ${cartItem?.isExtra ? 'active' : ''}`}
                        onClick={() => onToggleOption && onToggleOption(cartKey, 'isExtra')}
                        title="สลับเป็น พิเศษ (+10 บาท)"
                      >
                        ⭐ {cartItem?.isExtra ? 'พิเศษ (+10)' : 'พิเศษ'}
                      </button>
                      <button
                        type="button"
                        className={`card-mini-option-btn ${cartItem?.hasEgg ? 'active' : ''}`}
                        onClick={() => onToggleOption && onToggleOption(cartKey, 'hasEgg')}
                        title="เพิ่มไข่ดาว (+10 บาท)"
                      >
                        🍳 {cartItem?.hasEgg ? '+ไข่ดาว (+10)' : '+ไข่ดาว'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
