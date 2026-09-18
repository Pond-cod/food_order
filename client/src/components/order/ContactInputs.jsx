import React from 'react';

export default function ContactInputs({ phone, setPhone, department, setDepartment }) {
  return (
    <div className="row g-2 mb-3">
      <div className="col-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12.5px' }}>
          <i className="fa-solid fa-phone text-primary"></i>
          <span>เบอร์โทรศัพท์:</span>
        </label>
        <input
          type="tel"
          className="form-control form-control-sm py-2 shadow-sm rounded-3"
          placeholder="เช่น 0812345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ fontSize: '13px' }}
        />
      </div>
      <div className="col-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12.5px' }}>
          <i className="fa-solid fa-building text-warning"></i>
          <span>แผนก / โต๊ะ:</span>
        </label>
        <input
          type="text"
          className="form-control form-control-sm py-2 shadow-sm rounded-3"
          placeholder="เช่น IT / บัญชี"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ fontSize: '13px' }}
        />
      </div>
    </div>
  );
}
