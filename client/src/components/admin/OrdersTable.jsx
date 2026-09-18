import React from 'react';
import { formatDisplayDate } from '../../utils/formatters';
import { DEFAULT_AVATAR } from '../../utils/assets';

export default function OrdersTable({ orders, onUpdateStatus, onOpenCustomerModal }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="fa-solid fa-clipboard-list text-primary"></i>
        <span>รายการสั่งซื้อทั้งหมด</span>
      </h5>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
          <thead className="table-light">
            <tr>
              <th>เวลาสั่ง</th>
              <th>รอบ</th>
              <th>ผู้สั่งซื้อ</th>
              <th>เมนู</th>
              <th>จำนวน</th>
              <th>หมายเหตุ</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>ปรับสถานะ</th>
            </tr>
          </thead>
          <tbody>
            {(!orders || orders.length === 0) ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  ยังไม่มีรายการสั่งซื้อ
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                let badgeClass = 'bg-warning text-dark';
                let statusText = 'รอดำเนินการ';

                if (o.status === 'Completed') {
                  badgeClass = 'bg-success text-white';
                  statusText = 'ปรุงเสร็จแล้ว';
                } else if (o.status === 'Cancelled') {
                  badgeClass = 'bg-secondary text-white';
                  statusText = 'ยกเลิก';
                }

                return (
                  <tr key={o.rowIndex || `${o.userId}_${o.timestamp}`}>
                    <td className="text-muted text-nowrap">{formatDisplayDate(o.timestamp)}</td>
                    <td className="fw-semibold text-nowrap">{o.round}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border d-flex align-items-center gap-2 text-start p-1 pe-2 rounded-pill"
                        onClick={() => onOpenCustomerModal(o)}
                        title="ดูข้อมูลผู้สั่ง"
                      >
                        <img
                          src={o.pictureUrl || DEFAULT_AVATAR}
                          alt="Avatar"
                          className="rounded-circle border"
                          style={{ width: '26px', height: '26px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                        <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '110px' }}>
                          {o.displayName}
                        </span>
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: '10px' }}>
                          <i className="fa-solid fa-circle-info"></i>
                        </span>
                      </button>
                    </td>
                    <td className="fw-bold text-dark">{o.menuName}</td>
                    <td>
                      <span className="badge bg-success text-white px-2 py-1 fs-6">x{o.quantity}</span>
                    </td>
                    <td className="text-muted text-truncate" style={{ maxWidth: '140px' }}>
                      {o.note || '-'}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass} rounded-pill px-2 py-1`}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success me-1 px-2 py-1"
                        onClick={() => onUpdateStatus(o.rowIndex, 'Completed')}
                        title="เสร็จสิ้น"
                      >
                        ✓ เสร็จ
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        onClick={() => onUpdateStatus(o.rowIndex, 'Cancelled')}
                        title="ยกเลิกออเดอร์"
                      >
                        ✕ ยกเลิก
                      </button>
                    </td>
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
