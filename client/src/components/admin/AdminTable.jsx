import React, { useState } from 'react';

export default function AdminTable({ admins, onAddAdmin, onDeleteAdmin, isSaving }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !userId.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    onAddAdmin(userId.trim(), name.trim(), 'Admin');
    setName('');
    setUserId('');
    setShowAddModal(false);
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-users-gear text-success"></i>
            <span>รายชื่อผู้ดูแลระบบ (Admin Whitelist)</span>
          </h5>
          <small className="text-muted">ผู้ที่มีรายชื่อในหน้านี้จะสามารถเข้าใช้งานหน้าจัดการหลังบ้านได้</small>
        </div>
        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fa-solid fa-user-plus"></i>
          <span>เพิ่มผู้ดูแล</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr>
              <th>ชื่อผู้ดูแล</th>
              <th>LINE User ID</th>
              <th>ตำแหน่ง</th>
              <th>วันที่เพิ่ม</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {(!admins || admins.length === 0) ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  ยังไม่มีข้อมูลผู้ดูแลระบบ
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.rowIndex || a.userId}>
                  <td><span className="fw-bold text-dark">{a.displayName}</span></td>
                  <td>
                    <code className="bg-light px-2 py-1 rounded">{a.userId}</code>
                  </td>
                  <td>
                    <span className="badge bg-success bg-opacity-10 text-success">{a.role}</span>
                  </td>
                  <td className="text-muted small">{a.createdAt || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {a.role !== 'SuperAdmin' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border text-danger px-2 py-1"
                        onClick={() => onDeleteAdmin(a.rowIndex, a.displayName)}
                        title="ถอนสิทธิ์ผู้ดูแล"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    ) : (
                      <span className="text-muted small">ผู้ดูแลหลัก</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white py-3">
                <h6 className="modal-title fw-bold">
                  <i className="fa-solid fa-user-plus me-2"></i>
                  เพิ่มผู้ดูแลระบบใหม่
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '13px' }}>
                      ชื่อผู้ดูแล: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น ผู้จัดการร้าน"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark" style={{ fontSize: '13px' }}>
                      LINE User ID (ขึ้นต้นด้วย U...): <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="เช่น U1a2b3c4d5e6f..."
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-light border" onClick={() => setShowAddModal(false)}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-success fw-bold px-4" disabled={isSaving}>
                    เพิ่มสิทธิ์
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
