import React, { useState, useEffect, useCallback } from 'react';
import KitchenSummary from './KitchenSummary';
import { DEFAULT_AVATAR } from '../../utils/assets';

/**
 * แปลง timestamp string หลายรูปแบบให้เป็น HH:MM (BUG-05 Fix)
 */
function formatTimestamp(raw) {
  if (!raw) return '-';
  try {
    const str = String(raw).trim();
    // standard GAS format: "2024-09-18 14:30:00"
    if (str.length >= 16 && str[10] === ' ') {
      return str.substring(11, 16);
    }
    // ISO format with T
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d)) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    }
    const d = new Date(str);
    if (!isNaN(d)) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return str.substring(0, 16);
  } catch (e) { return String(raw).substring(0, 16); }
}

function formatDateShort(raw) {
  if (!raw) return '';
  try {
    const str = String(raw).trim();
    const dateStr = str.length >= 10 ? str.substring(0, 10) : str;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${thaiMonths[month] || ''}`;
    }
    return dateStr;
  } catch (e) { return ''; }
}

const AUTO_REFRESH_SECONDS = 60;

export default function KitchenOrdersView({
  orders = [],
  menus = [],
  kitchenSummary = {},
  currentRound = '',
  onUpdateStatus,
  onViewCustomer,
  onRefresh,
  isLoading,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  // UX-06: track which order row is saving
  const [savingRowIndex, setSavingRowIndex] = useState(null);
  // UX-05: auto-refresh countdown
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);

  // UX-05: Auto-refresh ทุก 60 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (typeof onRefresh === 'function') onRefresh(true);
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleManualRefresh = useCallback(() => {
    setCountdown(AUTO_REFRESH_SECONDS);
    if (typeof onRefresh === 'function') onRefresh();
  }, [onRefresh]);

  // UX-06: loading state บนปุ่มสถานะ
  const handleUpdateStatus = useCallback(async (rowIndex, newStatus) => {
    setSavingRowIndex(rowIndex);
    try {
      await onUpdateStatus(rowIndex, newStatus);
    } finally {
      setSavingRowIndex(null);
    }
  }, [onUpdateStatus]);

  const pendingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'pending' || o.status === 'รอดำเนินการ').length;
  const cookingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'cooking' || o.status === 'กำลังปรุง').length;
  const deliveredCount = orders.filter((o) => (o.status || '').toLowerCase() === 'completed' || (o.status || '').toLowerCase() === 'delivered' || o.status === 'เสร็จสิ้น').length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'PENDING') {
      const s = (o.status || '').toLowerCase();
      if (s !== 'pending' && s !== 'รอดำเนินการ') return false;
    } else if (statusFilter === 'COOKING') {
      const s = (o.status || '').toLowerCase();
      if (s !== 'cooking' && s !== 'กำลังปรุง') return false;
    } else if (statusFilter === 'COMPLETED') {
      const s = (o.status || '').toLowerCase();
      if (s !== 'completed' && s !== 'delivered' && s !== 'เสร็จสิ้น') return false;
    } else if (statusFilter === 'CANCELLED') {
      const s = (o.status || '').toLowerCase();
      if (s !== 'cancelled' && s !== 'ยกเลิก') return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (o.displayName || '').toLowerCase().includes(q) ||
        (o.menuName || '').toLowerCase().includes(q) ||
        (o.phone || '').toLowerCase().includes(q) ||
        (o.department || '').toLowerCase().includes(q) ||
        (o.note || '').toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered' || s === 'เสร็จสิ้น') {
      return <span className="badge bg-success px-2 py-1"><i className="fa-solid fa-check me-1"></i>เสร็จสิ้น / ส่งแล้ว</span>;
    }
    if (s === 'cooking' || s === 'กำลังปรุง') {
      return <span className="badge bg-warning text-dark px-2 py-1"><i className="fa-solid fa-fire me-1"></i>กำลังปรุง</span>;
    }
    if (s === 'cancelled' || s === 'ยกเลิก') {
      return <span className="badge bg-danger px-2 py-1"><i className="fa-solid fa-xmark me-1"></i>ยกเลิก</span>;
    }
    return <span className="badge bg-primary px-2 py-1"><i className="fa-solid fa-clock me-1"></i>รอดำเนินการ</span>;
  };

  return (
    <div className="kitchen-orders-container mb-4">
      {/* 1. สรุปยอดครัว */}
      <div className="mb-4">
        <KitchenSummary summary={kitchenSummary} orders={orders} menus={menus} currentRound={currentRound} />
      </div>

      {/* 2. รายการสั่งซื้อ */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
        {/* Header & Controls */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 pb-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <i className="fa-solid fa-clipboard-list text-success"></i>
              <span>รายการสั่งซื้อทั้งหมด</span>
              <span className="badge bg-dark rounded-pill px-2">{orders.length} ออเดอร์</span>
            </h5>
            <small className="text-secondary">
              คลิกที่แถวหรือปุ่ม <strong>"ดูรายละเอียด"</strong> เพื่อดูข้อมูลผู้สั่ง แผนก และหมายเหตุครบถ้วน
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* UX-05: Countdown timer */}
            <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px', color: '#64748B' }}>
              <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin text-success' : 'text-secondary'}`} style={{ fontSize: '11px' }}></i>
              <span className="d-none d-sm-inline">
                {isLoading ? 'กำลังโหลด...' : `รีเฟรชอัตโนมัติใน ${countdown}s`}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={handleManualRefresh}
              disabled={isLoading}
              title="รีเฟรชข้อมูลออเดอร์"
            >
              <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
              <span className="d-none d-sm-inline">รีเฟรช</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
              onClick={() => window.print()}
            >
              <i className="fa-solid fa-print"></i>
              <span className="d-none d-sm-inline">พิมพ์ใบครัว</span>
            </button>
          </div>
        </div>

        {/* Filter Chips & Search */}
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-lg-7 d-flex flex-wrap gap-1">
            {[
              { key: 'ALL', label: `ทั้งหมด (${orders.length})`, cls: 'btn-dark', inactiveCls: 'btn-light border text-secondary' },
              { key: 'PENDING', label: `รอดำเนินการ (${pendingCount})`, icon: 'fa-clock', cls: 'btn-primary', inactiveCls: 'btn-light border text-primary' },
              { key: 'COOKING', label: `กำลังปรุง (${cookingCount})`, icon: 'fa-fire', cls: 'btn-warning text-dark', inactiveCls: 'btn-light border text-warning' },
              { key: 'COMPLETED', label: `เสร็จสิ้น (${deliveredCount})`, icon: 'fa-check', cls: 'btn-success', inactiveCls: 'btn-light border text-success' },
            ].map(({ key, label, icon, cls, inactiveCls }) => (
              <button
                key={key}
                type="button"
                className={`btn btn-sm rounded-pill fw-semibold px-3 py-1 ${statusFilter === key ? cls : inactiveCls}`}
                onClick={() => setStatusFilter(key)}
              >
                {icon && <i className={`fa-solid ${icon} me-1`}></i>}
                {label}
              </button>
            ))}
          </div>
          <div className="col-12 col-lg-5">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4 rounded-pill bg-light"
                placeholder="ค้นหาชื่อ, เมนู, เบอร์โทร, แผนก, หมายเหตุ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: '12px', top: '9px', fontSize: '12px' }}></i>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-responsive rounded-3 border">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary text-nowrap">
                <th style={{ width: '45px' }}>#</th>
                <th>เวลาสั่ง</th>
                <th>ผู้สั่ง / โปรไฟล์</th>
                <th>เมนูอาหาร</th>
                <th className="text-center" style={{ width: '70px' }}>จำนวน</th>
                <th>หมายเหตุ</th>
                <th>แผนก/โต๊ะ</th>
                <th className="text-center">สถานะ</th>
                <th className="text-center" style={{ width: '130px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="fa-solid fa-clipboard-check fs-2 d-block mb-2 text-secondary opacity-50"></i>
                    ไม่พบรายการออเดอร์ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isSavingThis = savingRowIndex === order.rowIndex;
                  return (
                    <tr key={order.rowIndex || idx} style={{ cursor: 'pointer' }}>
                      <td className="fw-bold text-muted" onClick={() => onViewCustomer(order)}>{idx + 1}</td>

                      {/* Timestamp — BUG-05 Fix */}
                      <td className="text-nowrap text-muted" onClick={() => onViewCustomer(order)}>
                        <span className="fw-semibold text-dark">{formatTimestamp(order.timestamp)}</span>
                        <small className="d-block text-secondary" style={{ fontSize: '10.5px' }}>
                          {formatDateShort(order.timestamp)}{order.round ? ` · ${order.round}` : ''}
                        </small>
                      </td>

                      {/* Customer Info */}
                      <td onClick={() => onViewCustomer(order)}>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={order.pictureUrl || DEFAULT_AVATAR}
                            alt={order.displayName}
                            className="rounded-circle border"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                          />
                          <div className="overflow-hidden">
                            <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '130px' }}>{order.displayName}</div>
                            {order.phone && order.phone !== '-' && (
                              <a
                                href={`tel:${order.phone}`}
                                className="text-decoration-none text-primary small d-flex align-items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                                style={{ fontSize: '11px' }}
                              >
                                <i className="fa-solid fa-phone" style={{ fontSize: '9px' }}></i>
                                {order.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Menu Name */}
                      <td onClick={() => onViewCustomer(order)}>
                        <span className="fw-bold text-dark">{order.menuName}</span>
                      </td>

                      {/* Quantity */}
                      <td className="text-center fw-bold fs-6 text-success" onClick={() => onViewCustomer(order)}>
                        {order.quantity}
                      </td>

                      {/* Note */}
                      <td onClick={() => onViewCustomer(order)}>
                        {order.note && order.note !== '-' ? (
                          <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1" style={{ fontSize: '11px' }}>
                            <i className="fa-regular fa-comment-dots me-1"></i>{order.note}
                          </span>
                        ) : <span className="text-muted">-</span>}
                      </td>

                      {/* Department */}
                      <td className="text-muted text-nowrap" onClick={() => onViewCustomer(order)}>
                        {order.department && order.department !== '-' ? (
                          <span className="badge bg-light text-dark border">
                            <i className="fa-solid fa-location-dot me-1 text-danger"></i>
                            {order.department}
                          </span>
                        ) : '-'}
                      </td>

                      {/* Status */}
                      <td className="text-center" onClick={() => onViewCustomer(order)}>
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions — UX-06 */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 px-2 py-1 shadow-sm"
                            style={{ fontSize: '11.5px' }}
                            onClick={() => onViewCustomer(order)}
                            title="กดดูรายละเอียดผู้สั่งซื้อและหมายเหตุทั้งหมด"
                          >
                            <i className="fa-solid fa-eye"></i>
                            <span>รายละเอียด</span>
                          </button>

                          {((order.status || '').toLowerCase() === 'pending' || order.status === 'รอดำเนินการ') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-warning px-2 py-1 fw-semibold text-dark shadow-sm"
                              style={{ fontSize: '11px', minWidth: '28px' }}
                              onClick={() => handleUpdateStatus(order.rowIndex, 'Cooking')}
                              disabled={isSavingThis}
                              title="ปรับเป็นกำลังปรุง"
                            >
                              {isSavingThis
                                ? <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                                : <i className="fa-solid fa-fire"></i>}
                            </button>
                          )}

                          {((order.status || '').toLowerCase() === 'cooking' || order.status === 'กำลังปรุง') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success px-2 py-1 fw-semibold shadow-sm"
                              style={{ fontSize: '11px', minWidth: '28px' }}
                              onClick={() => handleUpdateStatus(order.rowIndex, 'Delivered')}
                              disabled={isSavingThis}
                              title="ปรับเป็นส่งแล้ว"
                            >
                              {isSavingThis
                                ? <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                                : <i className="fa-solid fa-check"></i>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
