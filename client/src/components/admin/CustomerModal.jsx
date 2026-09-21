import React from 'react';
import { formatDisplayDate } from '../../utils/formatters';
import { DEFAULT_AVATAR } from '../../utils/assets';

export default function CustomerModal({ order, onClose, onUpdateStatus }) {
  if (!order) return null;

  function copyText(text) {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    alert('คัดลอกเรียบร้อยแล้ว');
  }

  const hasPhone = order.phone && order.phone !== '-' && order.phone.trim() !== '';

  const handleStatusChange = (newStatus) => {
    if (typeof onUpdateStatus === 'function') {
      onUpdateStatus(order.rowIndex, newStatus, true);
    }
    if (onClose) onClose();
  };

  const currentStatus = String(order.status || '').toLowerCase();

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-light py-3">
            <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="fa-solid fa-address-card text-success"></i>
              <span>ข้อมูลผู้สั่งซื้ออย่างละเอียด</span>
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* Header Profile */}
            <div className="d-flex align-items-center gap-3 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 mb-3">
              <img
                src={order.pictureUrl || DEFAULT_AVATAR}
                alt="Profile"
                className="rounded-circle border border-2 border-white shadow-sm"
                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <div className="overflow-hidden">
                <h6 className="fw-bold mb-1 text-dark text-truncate">{order.displayName}</h6>
                {order.statusMessage && order.statusMessage !== '-' ? (
                  <small className="text-muted d-block text-truncate fst-italic">
                    "{order.statusMessage}"
                  </small>
                ) : (
                  <small className="text-muted d-block">ผู้สั่งอาหารผ่าน LINE LIFF</small>
                )}
              </div>
            </div>

            {/* Information Items */}
            <div className="list-group list-group-flush border rounded-3 mb-3" style={{ fontSize: '13px' }}>
              {/* LINE User ID */}
              <div className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                <span className="text-muted d-flex align-items-center gap-2">
                  <i className="fa-brands fa-line text-success fs-6"></i>
                  <span>LINE User ID:</span>
                </span>
                <div className="d-flex align-items-center gap-1">
                  <code className="bg-light px-2 py-1 rounded text-truncate" style={{ maxWidth: '170px' }}>
                    {order.userId}
                  </code>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border py-0 px-2"
                    onClick={() => copyText(order.userId)}
                    title="คัดลอก ID"
                  >
                    <i className="fa-regular fa-copy"></i>
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                <span className="text-muted d-flex align-items-center gap-2">
                  <i className="fa-solid fa-phone text-primary"></i>
                  <span>เบอร์โทรศัพท์:</span>
                </span>
                <div>
                  {hasPhone ? (
                    <div className="d-flex align-items-center gap-1">
                      <span className="fw-bold text-dark">{order.phone}</span>
                      <a href={`tel:${order.phone}`} className="btn btn-sm btn-outline-success py-0 px-2">
                        <i className="fa-solid fa-phone-volume"></i> โทร
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted">ไม่ระบุ</span>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                <span className="text-muted d-flex align-items-center gap-2">
                  <i className="fa-solid fa-building text-warning"></i>
                  <span>แผนก / จุดส่ง:</span>
                </span>
                <span className="fw-bold text-dark">{order.department || 'ไม่ระบุ'}</span>
              </div>
            </div>

            {/* Order Details in this Round */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                <i className="fa-solid fa-utensils text-success"></i>
                <span>รายละเอียดออเดอร์ในรอบนี้</span>
              </div>
              <div className="row g-2" style={{ fontSize: '12.5px' }}>
                <div className="col-6"><b>เมนู:</b> {order.menuName}</div>
                <div className="col-6"><b>จำนวน:</b> <span className="text-success fw-bold">x{order.quantity}</span></div>
                <div className="col-6"><b>รอบ:</b> {order.round}</div>
                <div className="col-6"><b>เวลาสั่ง:</b> {formatDisplayDate(order.timestamp)}</div>
                <div className="col-12"><b>หมายเหตุ:</b> {order.note || '-'}</div>
              </div>
            </div>

            {/* Quick Status Actions Box */}
            <div className="p-3 bg-white rounded-3 border">
              <div className="fw-bold text-dark mb-2 d-flex align-items-center justify-content-between" style={{ fontSize: '12.5px' }}>
                <span className="d-flex align-items-center gap-1">
                  <i className="fa-brands fa-line text-success"></i>
                  <span>เปลี่ยนสถานะ (ส่งแจ้งเตือนเข้า LINE ทันที):</span>
                </span>
                <span className="badge bg-secondary rounded-pill px-2">{order.status || 'Pending'}</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-fill ${currentStatus === 'pending' || currentStatus === 'รอดำเนินการ' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusChange('Pending')}
                >
                  <i className="fa-solid fa-clock me-1"></i>รอดำเนินการ
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill ${currentStatus === 'cooking' || currentStatus === 'กำลังปรุง' ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning text-dark'}`}
                  onClick={() => handleStatusChange('Cooking')}
                >
                  <i className="fa-solid fa-fire me-1"></i>กำลังปรุง
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill ${currentStatus === 'completed' || currentStatus === 'เสร็จสิ้น' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                  onClick={() => handleStatusChange('Completed')}
                >
                  <i className="fa-solid fa-check me-1"></i>เสร็จสิ้น/ส่งแล้ว
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill ${currentStatus === 'cancelled' || currentStatus === 'ยกเลิก' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => handleStatusChange('Cancelled')}
                >
                  <i className="fa-solid fa-xmark me-1"></i>ยกเลิก
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
