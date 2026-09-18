import React from 'react';

export default function ContactInputs({ phone, setPhone, department, setDepartment }) {
  return (
    <div className="row g-2 mb-3">
      <div className="col-12 col-sm-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-1 mb-1" style={{ fontSize: '13px' }}>
          <i className="fa-solid fa-phone text-primary"></i>
          <span>เบอร์โทรศัพท์ติดต่อ:</span>
        </label>
        <div className="position-relative">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className="form-control py-2 shadow-sm rounded-3 bg-white"
            placeholder="เช่น 0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ fontSize: '13.5px' }}
          />
        </div>
      </div>
      <div className="col-12 col-sm-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-1 mb-1" style={{ fontSize: '13px' }}>
          <i className="fa-solid fa-location-dot text-danger"></i>
          <span>แผนก / โต๊ะจัดส่ง:</span>
        </label>
        <div className="position-relative">
          <input
            type="text"
            className="form-control py-2 shadow-sm rounded-3 bg-white"
            placeholder="เช่น ฝ่าย IT / ชั้น 3 / โต๊ะ A1"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ fontSize: '13.5px' }}
          />
        </div>
      </div>
    </div>
  );
}
