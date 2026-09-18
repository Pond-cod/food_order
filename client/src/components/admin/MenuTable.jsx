import React from 'react';
import { formatCurrency } from '../../utils/formatters';

function MenuThumbImage({ imageUrl, name, onZoomImage }) {
  const [hasError, setHasError] = React.useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="menu-thumb-wrapper" style={{ cursor: 'default' }}>
        <div className="menu-thumb-placeholder">
          <i className="fa-solid fa-bowl-food"></i>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="menu-thumb-wrapper" 
      onClick={() => onZoomImage(imageUrl, name)}
      title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
    >
      <img
        src={imageUrl}
        alt={name}
        className="menu-thumb-img"
        onError={() => setHasError(true)}
      />
      <div className="menu-thumb-zoom">
        <i className="fa-solid fa-magnifying-glass-plus"></i>
      </div>
    </div>
  );
}

export default function MenuTable({ menus, onToggleStatus, onEditMenu, onDeleteMenu, onZoomImage, onOpenAddModal, role = 'Admin' }) {
  const isCook = (role || '').toLowerCase() === 'cook' || (role || '').toLowerCase() === 'kitchen';
  const canEditCatalog = !isCook;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-bowl-food text-success"></i>
            <span>เมนูอาหารทั้งหมด</span>
          </h5>
          <small className="text-muted">
            {isCook 
              ? 'สิทธิ์พ่อครัว: สามารถกดสลับสวิตช์เปิด/ปิดขายได้ทันที หากวัตถุดิบหมด' 
              : 'กดสลับสวิตช์เพื่อเปิดขาย / ปิดขาย สำหรับรอบแต่ละวันได้ทันที'}
          </small>
        </div>
        {canEditCatalog && (
          <button
            type="button"
            className="btn btn-success d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm"
            onClick={onOpenAddModal}
          >
            <i className="fa-solid fa-plus"></i>
            <span>เพิ่มเมนูใหม่</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: '50px' }}>ลำดับ</th>
              <th style={{ width: '70px', textAlign: 'center' }}>รูปภาพ</th>
              <th>ชื่อเมนู</th>
              <th>ราคา</th>
              <th>สถานะขาย</th>
              <th>เปิด/ปิดขาย</th>
              {canEditCatalog && <th style={{ textAlign: 'right' }}>จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {(!menus || menus.length === 0) ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  ยังไม่มีรายการเมนู
                </td>
              </tr>
            ) : (
              menus.map((menu, idx) => {
                const isAvail = menu.status === 'Available';

                return (
                  <tr key={menu.rowIndex || idx}>
                    <td className="text-muted">{idx + 1}</td>
                    <td className="text-center">
                      <MenuThumbImage imageUrl={menu.imageUrl} name={menu.name} onZoomImage={onZoomImage} />
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{menu.name}</span>
                    </td>
                    <td className="fw-semibold text-secondary">
                      {formatCurrency(menu.price)}
                    </td>
                    <td>
                      <span className={`badge ${isAvail ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        <i className="fa-solid fa-circle me-1" style={{ fontSize: '6px' }}></i>
                        {isAvail ? 'พร้อมขาย' : 'ปิดขาย'}
                      </span>
                    </td>
                    <td>
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={isAvail}
                          style={{ cursor: 'pointer' }}
                          onChange={(e) => onToggleStatus(menu.rowIndex, e.target.checked ? 'Available' : 'Sold Out')}
                        />
                      </div>
                    </td>
                    {canEditCatalog && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border text-primary me-1 px-2 py-1"
                          onClick={() => onEditMenu(menu)}
                          title="แก้ไขเมนู"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border text-danger px-2 py-1"
                          onClick={() => onDeleteMenu(menu.rowIndex, menu.name)}
                          title="ลบเมนู"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
