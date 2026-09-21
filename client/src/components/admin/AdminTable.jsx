import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminTable({ 
  admins = [], 
  onAddAdmin, 
  onEditAdmin, 
  onToggleAdminStatus, 
  onDeleteAdmin, 
  isSaving 
}) {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRowIndex, setEditRowIndex] = useState(null);

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Admin');

  // ลิงก์สำหรับส่งให้ผู้ดูแลใหม่เปิดเพื่อดู User ID
  const LIFF_ID = "2011625055-XnlJJcQp";
  const inviteLink = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `https://liff.line.me/${LIFF_ID}#admin`
    : (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#admin` : `https://liff.line.me/${LIFF_ID}#admin`);

  const inviteMessage = `ขอเชิญร่วมเป็นผู้ดูแลระบบสั่งอาหาร\nกรุณากดเปิดลิงก์นี้ใน LINE เพื่อดูและคัดลอก LINE User ID ส่งกลับมาให้แอดมินเปิดสิทธิ์:\n${inviteLink}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกลิงก์สำเร็จ!',
      text: 'ส่งลิงก์นี้ให้ผู้ที่ต้องการให้เป็นแอดมิน เพื่อให้เขาเปิดใน LINE แล้วส่ง User ID กลับมาครับ',
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const handleCopyInviteMessage = () => {
    navigator.clipboard.writeText(inviteMessage);
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกข้อความพร้อมลิงก์สำเร็จ!',
      text: 'นำข้อความนี้ไปวางส่งในแชท LINE ได้ทันทีครับ',
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const handleShareToLine = () => {
    const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(inviteMessage)}`;
    window.open(shareUrl, '_blank');
  };

  // เปิด Modal เพิ่ม
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditRowIndex(null);
    setName('');
    setUserId('');
    setRole('Admin');
    setShowModal(true);
  };

  // เปิด Modal แก้ไข
  const handleOpenEdit = (admin) => {
    setIsEditing(true);
    setEditRowIndex(admin.rowIndex);
    setName(admin.displayName || '');
    setUserId(admin.userId || '');
    setRole(admin.role || 'Admin');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !userId.trim()) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกชื่อและ LINE User ID' });
      return;
    }

    if (isEditing) {
      if (onEditAdmin) {
        onEditAdmin(editRowIndex, userId.trim(), name.trim(), role);
      }
    } else {
      onAddAdmin(userId.trim(), name.trim(), role);
    }

    setShowModal(false);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-3 border-bottom">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <i className="fa-solid fa-user-shield text-success"></i>
            <span>จัดการผู้ดูแลระบบ (Admin Access Control)</span>
            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2">
              {admins.length} ท่าน
            </span>
          </h5>
          <small className="text-secondary">
            กำหนดสิทธิ์การเข้าถึงหลังบ้าน สามารถแก้ไข, ระงับ/ปิดสิทธิ์ชั่วคราว หรือลบผู้ดูแลระบบได้
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm"
            onClick={handleCopyInviteLink}
            title="คัดลอกลิงก์สำหรับส่งให้ผู้ดูแลใหม่เปิดดู User ID ใน LINE"
          >
            <i className="fa-solid fa-share-nodes"></i>
            <span>ส่งลิงก์ขอ User ID</span>
          </button>

          <button
            type="button"
            className="btn btn-success d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm"
            onClick={handleOpenAdd}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>เพิ่มผู้ดูแลระบบ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive rounded-3 border">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr className="text-secondary text-nowrap">
              <th>#</th>
              <th>ชื่อผู้ดูแล</th>
              <th>LINE User ID</th>
              <th>ระดับสิทธิ์ (Role)</th>
              <th className="text-center" style={{ width: '130px' }}>สถานะการใช้งาน</th>
              <th>วันที่เพิ่ม</th>
              <th className="text-center" style={{ width: '130px' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {(!admins || admins.length === 0) ? (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <i className="fa-solid fa-users-slash fs-2 d-block mb-2 text-secondary opacity-50"></i>
                  ยังไม่มีข้อมูลผู้ดูแลระบบ
                </td>
              </tr>
            ) : (
              admins.map((a, idx) => {
                const isActive = (a.status || 'Active').toLowerCase() === 'active';
                const isSuper = a.role === 'SuperAdmin';

                return (
                  <tr key={a.rowIndex || a.userId || idx} className={!isActive ? 'table-light opacity-75' : ''}>
                    <td className="text-muted fw-bold">{idx + 1}</td>
                    
                    {/* Name */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${
                            isSuper ? 'bg-warning text-dark' : isActive ? 'bg-success' : 'bg-secondary'
                          }`}
                          style={{ width: '32px', height: '32px', fontSize: '13px' }}
                        >
                          {isSuper ? <i className="fa-solid fa-crown"></i> : a.displayName ? a.displayName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <span className="fw-bold text-dark">{a.displayName}</span>
                          {!isActive && <span className="badge bg-secondary ms-2" style={{ fontSize: '10px' }}>ปิดใช้งาน</span>}
                        </div>
                      </div>
                    </td>

                    {/* User ID */}
                    <td>
                      <code className="bg-light px-2 py-1 rounded border text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                        {a.userId}
                      </code>
                    </td>

                    {/* Role */}
                    <td>
                      {(() => {
                        const roleStr = a.role || 'Admin';
                        const isC = roleStr.toLowerCase() === 'cook' || roleStr.toLowerCase() === 'kitchen';
                        if (isSuper) {
                          return (
                            <span className="badge px-2 py-1 rounded-pill bg-warning text-dark border border-warning">
                              <i className="fa-solid fa-crown me-1"></i>SuperAdmin
                            </span>
                          );
                        }
                        if (isC) {
                          return (
                            <span className="badge px-2 py-1 rounded-pill bg-warning bg-opacity-25 text-dark border border-warning">
                              <i className="fa-solid fa-fire-burner me-1 text-danger"></i>Cook (พ่อครัว)
                            </span>
                          );
                        }
                        return (
                          <span className="badge px-2 py-1 rounded-pill bg-success bg-opacity-10 text-success border border-success">
                            <i className="fa-solid fa-user-gear me-1"></i>Admin (ผู้จัดการ)
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status Switch (Active / Inactive) */}
                    <td className="text-center">
                      {isSuper ? (
                        <span className="badge bg-success">เปิดตลอดเวลา</span>
                      ) : (
                        <div className="form-check form-switch d-flex justify-content-center mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isActive}
                            onChange={() => onToggleAdminStatus && onToggleAdminStatus(a.rowIndex, isActive ? 'Inactive' : 'Active')}
                            title={isActive ? 'คลิกเพื่อปิดการใช้งานชั่วคราว' : 'คลิกเพื่อเปิดการใช้งาน'}
                            style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="text-muted small text-nowrap">{a.createdAt || '-'}</td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        {/* ปุ่มแก้ไข */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-2 py-1"
                          onClick={() => handleOpenEdit(a)}
                          title="แก้ไขชื่อและสิทธิ์"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>

                        {/* ปุ่มลบ */}
                        {!isSuper && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger px-2 py-1"
                            onClick={() => onDeleteAdmin(a.rowIndex, a.displayName)}
                            title="ถอนสิทธิ์ผู้ดูแลถาวร"
                          >
                            <i className="fa-solid fa-trash"></i>
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

      {/* Add / Edit Admin Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light py-3">
                <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className={`fa-solid ${isEditing ? 'fa-user-pen text-primary' : 'fa-user-plus text-success'}`}></i>
                  <span>{isEditing ? 'แก้ไขข้อมูลผู้ดูแลระบบ' : 'เพิ่มผู้ดูแลระบบใหม่'}</span>
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '13px' }}>
                      ชื่อผู้ดูแล (Display Name):
                    </label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="เช่น สมชาย (IT), แอดมินร้าน"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '13px' }}>
                      LINE User ID: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control rounded-3 font-monospace"
                      placeholder="เช่น U1a2b3c4d5e6f7..."
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '11px' }}>
                      LINE User ID ดูได้จากหน้าโปรไฟล์ LINE หรือตารางออเดอร์ในหน้าจอครัว
                    </small>
                  </div>

                  {/* กล่องส่งลิงก์เชิญเพื่อขอ LINE User ID */}
                  {!isEditing && (
                    <div className="p-3 rounded-3 mb-3" style={{ background: '#F0FDF4', border: '1.5px dashed #86EFAC' }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <strong className="text-success small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-circle-question"></i>
                          <span>ยังไม่มี LINE User ID ของคนนี้?</span>
                        </strong>
                        <span className="badge bg-success text-white py-0 px-2" style={{ fontSize: '10px' }}>วิธีที่ง่ายที่สุด</span>
                      </div>
                      <p className="text-secondary small mb-2" style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                        ส่งลิงก์นี้ให้เขาเปิดใน LINE ระบบจะแสดง User ID พร้อมปุ่มกดส่งกลับมาให้คุณทันที:
                      </p>
                      <div className="input-group input-group-sm mb-2">
                        <input
                          type="text"
                          className="form-control bg-white font-monospace text-muted"
                          value={inviteLink}
                          readOnly
                          style={{ fontSize: '11px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-success d-flex align-items-center gap-1"
                          onClick={handleCopyInviteLink}
                          title="คัดลอกลิงก์"
                        >
                          <i className="fa-regular fa-copy"></i>
                          <span>คัดลอก</span>
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-success text-white d-flex align-items-center gap-1 px-2 py-1 shadow-sm"
                          style={{ fontSize: '11.5px', borderRadius: '6px' }}
                          onClick={handleShareToLine}
                        >
                          <i className="fa-brands fa-line fs-6"></i>
                          <span>ส่งแชทใน LINE ทันที</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2 py-1"
                          style={{ fontSize: '11.5px', borderRadius: '6px' }}
                          onClick={handleCopyInviteMessage}
                        >
                          <i className="fa-solid fa-comment-dots"></i>
                          <span>คัดลอกข้อความชวน</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '13px' }}>
                      ระดับสิทธิ์ (Role):
                    </label>
                    <select
                      className="form-select rounded-3"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Admin">Admin (กำหนดหน้าสั่งอาหาร & จัดการเมนู)</option>
                      <option value="Cook">Cook (เน้นเมนู และออเดอร์ครัว - รับแจ้งเตือนออเดอร์ใหม่ใน LINE 🍳)</option>
                      <option value="SuperAdmin">SuperAdmin (เจ้าของร้าน / จัดการได้ทุกส่วน - รับแจ้งเตือนใน LINE 📲)</option>
                    </select>
                    <div className="alert alert-success bg-success bg-opacity-10 border-success border-opacity-25 py-2 px-2 mt-2 mb-0" style={{ fontSize: '11px' }}>
                      <i className="fa-solid fa-bell text-success me-1"></i>
                      <strong>ระบบแจ้งเตือนอัตโนมัติ:</strong> ผู้ใช้ที่มีบทบาท <strong>Cook</strong> และ <strong>SuperAdmin</strong> จะได้รับข้อความแจ้งเตือนผ่าน LINE ทันทีที่มีลูกค้าสั่งอาหารใหม่เข้าครัว
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-3"
                    onClick={() => setShowModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm px-4 fw-bold shadow-sm ${isEditing ? 'btn-primary' : 'btn-success'}`}
                    disabled={isSaving}
                  >
                    {isSaving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มผู้ดูแล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
