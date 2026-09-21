import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import KitchenSummary from './KitchenSummary';
import { DEFAULT_AVATAR } from '../../utils/assets';

/**
 * แปลง timestamp string หลายรูปแบบให้เป็น HH:MM
 */
function formatTimestamp(raw) {
  if (!raw) return '-';
  try {
    const str = String(raw).trim();
    if (str.length >= 16 && str[10] === ' ') {
      return str.substring(11, 16);
    }
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

/**
 * แปลงสถานะให้อยู่ในมาตรฐานเดียวกัน
 */
function normalizeStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'cooking' || s === 'กำลังปรุง' || s === 'กำลังทำ') return 'Cooking';
  if (s === 'completed' || s === 'delivered' || s === 'เสร็จสิ้น' || s === 'ส่งแล้ว' || s === 'พร้อมรับ') return 'Completed';
  if (s === 'cancelled' || s === 'ยกเลิก') return 'Cancelled';
  return 'Pending';
}

function getStatusBadgeClass(status) {
  const norm = normalizeStatus(status);
  if (norm === 'Completed') return 'btn-success text-white border-success';
  if (norm === 'Cooking') return 'btn-warning text-dark border-warning';
  if (norm === 'Cancelled') return 'btn-danger text-white border-danger';
  return 'btn-primary text-white border-primary';
}

function getStatusLabel(status) {
  const norm = normalizeStatus(status);
  if (norm === 'Completed') return 'เสร็จสิ้น / ส่งแล้ว';
  if (norm === 'Cooking') return 'กำลังปรุง';
  if (norm === 'Cancelled') return 'ยกเลิก';
  return 'รอดำเนินการ';
}

function getStatusIcon(status) {
  const norm = normalizeStatus(status);
  if (norm === 'Completed') return <i className="fa-solid fa-check me-1"></i>;
  if (norm === 'Cooking') return <i className="fa-solid fa-fire me-1"></i>;
  if (norm === 'Cancelled') return <i className="fa-solid fa-xmark me-1"></i>;
  return <i className="fa-solid fa-clock me-1"></i>;
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
  const [savingRowIndex, setSavingRowIndex] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [openStatusMenuRow, setOpenStatusMenuRow] = useState(null);

  // ปิด Dropdown เมนูเมื่อคลิกพื้นที่อื่น
  useEffect(() => {
    const handleGlobalClick = () => setOpenStatusMenuRow(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Auto-refresh ทุก 60 วินาที
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

  // ฟังก์ชันอัปเดตสถานะ (ส่งแจ้งเตือนเข้า LINE อัตโนมัติ)
  const handleUpdateStatus = useCallback(async (rowIndex, newStatus) => {
    setOpenStatusMenuRow(null);
    setSavingRowIndex(rowIndex);
    try {
      await onUpdateStatus(rowIndex, newStatus, true);
    } finally {
      setSavingRowIndex(null);
    }
  }, [onUpdateStatus]);

  // กล่องยืนยันกรณียกเลิกออเดอร์
  const handleConfirmCancel = async (rowIndex, menuName) => {
    setOpenStatusMenuRow(null);
    const result = await Swal.fire({
      title: 'ยืนยันยกเลิกออเดอร์?',
      text: `ต้องการยกเลิก "${menuName}" และส่งข้อความแจ้งเตือนลูกค้าใน LINE หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันยกเลิก',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#DC2626',
    });
    if (result.isConfirmed) {
      handleUpdateStatus(rowIndex, 'Cancelled');
    }
  };

  const pendingCount = orders.filter((o) => normalizeStatus(o.status) === 'Pending').length;
  const cookingCount = orders.filter((o) => normalizeStatus(o.status) === 'Cooking').length;
  const deliveredCount = orders.filter((o) => normalizeStatus(o.status) === 'Completed').length;
  const cancelledCount = orders.filter((o) => normalizeStatus(o.status) === 'Cancelled').length;

  const filteredOrders = orders.filter((o) => {
    const norm = normalizeStatus(o.status);
    if (statusFilter === 'PENDING' && norm !== 'Pending') return false;
    if (statusFilter === 'COOKING' && norm !== 'Cooking') return false;
    if (statusFilter === 'COMPLETED' && norm !== 'Completed') return false;
    if (statusFilter === 'CANCELLED' && norm !== 'Cancelled') return false;

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
            <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                <i className="fa-brands fa-line me-1"></i>ระบบส่งแจ้งเตือนเข้า LINE ลูกค้าอัตโนมัติเมื่อเปลี่ยนสถานะ
              </span>
              <small className="text-secondary">
                คลิกปุ่มสถานะเพื่อเลือกเปลี่ยนได้ทันที
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px', color: '#64748B' }}>
              <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin text-success' : 'text-secondary'}`} style={{ fontSize: '11px' }}></i>
              <span className="d-none d-sm-inline">
                {isLoading ? 'กำลังโหลด...' : `รีเฟรชใน ${countdown}s`}
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
              { key: 'CANCELLED', label: `ยกเลิก (${cancelledCount})`, icon: 'fa-xmark', cls: 'btn-danger', inactiveCls: 'btn-light border text-danger' },
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
                <th className="text-center" style={{ width: '65px' }}>จำนวน</th>
                <th>หมายเหตุ</th>
                <th>แผนก/โต๊ะ</th>
                <th className="text-center" style={{ minWidth: '150px' }}>สถานะ (คลิกเพื่อเปลี่ยน)</th>
                <th className="text-center" style={{ minWidth: '170px' }}>จัดการ</th>
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
                  const currentNorm = normalizeStatus(order.status);
                  const isMenuOpen = openStatusMenuRow === order.rowIndex;

                  return (
                    <tr key={order.rowIndex || idx}>
                      <td className="fw-bold text-muted" onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>{idx + 1}</td>

                      {/* Timestamp */}
                      <td className="text-nowrap text-muted" onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
                        <span className="fw-semibold text-dark">{formatTimestamp(order.timestamp)}</span>
                        <small className="d-block text-secondary" style={{ fontSize: '10.5px' }}>
                          {formatDateShort(order.timestamp)}{order.round ? ` · ${order.round}` : ''}
                        </small>
                      </td>

                      {/* Customer Info */}
                      <td onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
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
                      <td onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
                        <span className="fw-bold text-dark">{order.menuName}</span>
                      </td>

                      {/* Quantity */}
                      <td className="text-center fw-bold fs-6 text-success" onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
                        {order.quantity}
                      </td>

                      {/* Note */}
                      <td onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
                        {order.note && order.note !== '-' ? (
                          <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1" style={{ fontSize: '11px' }}>
                            <i className="fa-regular fa-comment-dots me-1"></i>{order.note}
                          </span>
                        ) : <span className="text-muted">-</span>}
                      </td>

                      {/* Department */}
                      <td className="text-muted text-nowrap" onClick={() => onViewCustomer(order)} style={{ cursor: 'pointer' }}>
                        {order.department && order.department !== '-' ? (
                          <span className="badge bg-light text-dark border">
                            <i className="fa-solid fa-location-dot me-1 text-danger"></i>
                            {order.department}
                          </span>
                        ) : '-'}
                      </td>

                      {/* Status Dropdown Picker */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="position-relative d-inline-block">
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm d-inline-flex align-items-center gap-1 ${getStatusBadgeClass(order.status)}`}
                            onClick={() => setOpenStatusMenuRow(isMenuOpen ? null : order.rowIndex)}
                            disabled={isSavingThis}
                            style={{ fontSize: '12px', minWidth: '135px', justifyContent: 'center' }}
                            title="คลิกเพื่อเลือกเปลี่ยนสถานะ (ส่ง LINE แจ้งเตือนลูกค้าทันที)"
                          >
                            {isSavingThis ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" style={{ width: '12px', height: '12px' }}></span>
                                <span>กำลังบันทึก...</span>
                              </>
                            ) : (
                              <>
                                {getStatusIcon(order.status)}
                                <span>{getStatusLabel(order.status)}</span>
                                <i className="fa-solid fa-chevron-down ms-1 opacity-75" style={{ fontSize: '9px' }}></i>
                              </>
                            )}
                          </button>

                          {/* Popup Menu */}
                          {isMenuOpen && (
                            <div
                              className="card position-absolute shadow-lg border-0 rounded-3 p-2 text-start"
                              style={{
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                minWidth: '220px',
                                zIndex: 1060,
                                marginTop: '6px',
                                fontSize: '12.5px',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="px-2 py-1 text-muted border-bottom mb-1 small d-flex align-items-center justify-content-between">
                                <span><i className="fa-brands fa-line text-success me-1"></i>ส่งข้อความ LINE อัตโนมัติ:</span>
                              </div>

                              <button
                                type="button"
                                className={`btn btn-sm text-start w-100 rounded-2 py-2 px-2 mb-1 d-flex align-items-center gap-2 ${currentNorm === 'Pending' ? 'btn-primary text-white' : 'btn-light text-dark'}`}
                                onClick={() => handleUpdateStatus(order.rowIndex, 'Pending')}
                              >
                                <span className="badge bg-primary rounded-circle p-1"><i className="fa-solid fa-clock"></i></span>
                                <div>
                                  <div className="fw-bold">⏳ รอดำเนินการ</div>
                                  <small className="opacity-75 d-block" style={{ fontSize: '10.5px' }}>เข้าคิวรอทำในครัว</small>
                                </div>
                              </button>

                              <button
                                type="button"
                                className={`btn btn-sm text-start w-100 rounded-2 py-2 px-2 mb-1 d-flex align-items-center gap-2 ${currentNorm === 'Cooking' ? 'btn-warning text-dark' : 'btn-light text-dark'}`}
                                onClick={() => handleUpdateStatus(order.rowIndex, 'Cooking')}
                              >
                                <span className="badge bg-warning text-dark rounded-circle p-1"><i className="fa-solid fa-fire"></i></span>
                                <div>
                                  <div className="fw-bold">🍳 กำลังปรุงอาหาร</div>
                                  <small className="opacity-75 d-block" style={{ fontSize: '10.5px' }}>แจ้งลูกค้า: แม่ครัวเริ่มทำแล้ว</small>
                                </div>
                              </button>

                              <button
                                type="button"
                                className={`btn btn-sm text-start w-100 rounded-2 py-2 px-2 mb-1 d-flex align-items-center gap-2 ${currentNorm === 'Completed' ? 'btn-success text-white' : 'btn-light text-dark'}`}
                                onClick={() => handleUpdateStatus(order.rowIndex, 'Completed')}
                              >
                                <span className="badge bg-success rounded-circle p-1"><i className="fa-solid fa-check"></i></span>
                                <div>
                                  <div className="fw-bold">✅ เสร็จสิ้น / ส่งแล้ว</div>
                                  <small className="opacity-75 d-block" style={{ fontSize: '10.5px' }}>แจ้งลูกค้า: อาหารพร้อมรับ 🔔</small>
                                </div>
                              </button>

                              <div className="dropdown-divider my-1"></div>

                              <button
                                type="button"
                                className={`btn btn-sm text-start w-100 rounded-2 py-2 px-2 text-danger ${currentNorm === 'Cancelled' ? 'btn-danger text-white' : 'btn-light'}`}
                                onClick={() => handleConfirmCancel(order.rowIndex, order.menuName)}
                              >
                                <span className="badge bg-danger rounded-circle p-1"><i className="fa-solid fa-xmark"></i></span>
                                <div>
                                  <div className="fw-bold">❌ ยกเลิกออเดอร์</div>
                                  <small className="opacity-75 d-block" style={{ fontSize: '10.5px' }}>แจ้งเตือนยกเลิกใน LINE</small>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          {/* 1-Click Quick Transition Button */}
                          {currentNorm === 'Pending' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-warning text-dark px-2 py-1 fw-bold shadow-sm d-flex align-items-center gap-1"
                              style={{ fontSize: '11.5px' }}
                              onClick={() => handleUpdateStatus(order.rowIndex, 'Cooking')}
                              disabled={isSavingThis}
                              title="คลิกเดียว: เริ่มปรุงทันที + ส่งแจ้งเตือนใน LINE"
                            >
                              <i className="fa-solid fa-fire"></i>
                              <span>เริ่มทำ</span>
                            </button>
                          )}

                          {currentNorm === 'Cooking' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success text-white px-2 py-1 fw-bold shadow-sm d-flex align-items-center gap-1"
                              style={{ fontSize: '11.5px' }}
                              onClick={() => handleUpdateStatus(order.rowIndex, 'Completed')}
                              disabled={isSavingThis}
                              title="คลิกเดียว: ปรุงเสร็จแล้ว + ส่งแจ้งเตือนใน LINE"
                            >
                              <i className="fa-solid fa-check"></i>
                              <span>เสร็จแล้ว</span>
                            </button>
                          )}

                          {currentNorm === 'Completed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary px-2 py-1 d-flex align-items-center gap-1"
                              style={{ fontSize: '11.5px' }}
                              onClick={() => setOpenStatusMenuRow(isMenuOpen ? null : order.rowIndex)}
                              disabled={isSavingThis}
                              title="คลิกเพื่อเปลี่ยนสถานะอื่น"
                            >
                              <i className="fa-solid fa-arrows-rotate"></i>
                              <span className="d-none d-md-inline">เปลี่ยน</span>
                            </button>
                          )}

                          {currentNorm === 'Cancelled' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary px-2 py-1 d-flex align-items-center gap-1"
                              style={{ fontSize: '11.5px' }}
                              onClick={() => handleUpdateStatus(order.rowIndex, 'Pending')}
                              disabled={isSavingThis}
                              title="คืนสถานะเป็นรอดำเนินการ"
                            >
                              <i className="fa-solid fa-arrow-rotate-left"></i>
                              <span>คืนค่า</span>
                            </button>
                          )}

                          {/* Customer Details Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 px-2 py-1 shadow-sm"
                            style={{ fontSize: '11.5px' }}
                            onClick={() => onViewCustomer(order)}
                            title="กดดูรายละเอียดผู้สั่งซื้อ แผนก และหมายเหตุ"
                          >
                            <i className="fa-solid fa-eye"></i>
                            <span className="d-none d-sm-inline">รายละเอียด</span>
                          </button>
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
