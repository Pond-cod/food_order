import React from 'react';

export default function ContactInputs({ phone, setPhone, department, setDepartment, isSubmitted = false }) {
  const isPhoneMissing = isSubmitted && (!phone || !phone.trim());
  const isDeptMissing = isSubmitted && (!department || !department.trim());

  return (
    <div className="row g-2 mb-3">
      {/* 1. เบอร์โทรศัพท์ติดต่อ (จำเป็น) */}
      <div className="col-12 col-sm-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '13px' }}>
          <div className="d-flex align-items-center gap-2">
            <span 
              className="rounded-2 d-flex align-items-center justify-content-center text-white" 
              style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontSize: '11px' }}
            >
              <i className="fa-solid fa-phone"></i>
            </span>
            <span>เบอร์โทรศัพท์ติดต่อ:</span>
            <span className="text-danger fw-bold" title="จำเป็นต้องระบุ">*</span>
          </div>
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style={{ fontSize: '10.5px' }}>
            จำเป็น
          </span>
        </label>
        <div className="position-relative">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={`form-control py-2 ps-3 shadow-sm rounded-3 bg-white ${isPhoneMissing ? 'is-invalid border-danger' : ''}`}
            placeholder="เช่น 0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ 
              fontSize: '13.5px', 
              border: isPhoneMissing ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
              backgroundColor: isPhoneMissing ? '#FEF2F2' : '#FFFFFF'
            }}
            required
          />
          {isPhoneMissing && (
            <div className="text-danger small mt-1" style={{ fontSize: '11.5px' }}>
              ⚠️ กรุณากรอกเบอร์โทรศัพท์ติดต่อ
            </div>
          )}
        </div>
      </div>

      {/* 2. แผนก / โต๊ะจัดส่ง (จำเป็น) */}
      <div className="col-12 col-sm-6">
        <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '13px' }}>
          <div className="d-flex align-items-center gap-2">
            <span 
              className="rounded-2 d-flex align-items-center justify-content-center text-white" 
              style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', fontSize: '11px' }}
            >
              <i className="fa-solid fa-location-dot"></i>
            </span>
            <span>แผนก / โต๊ะจัดส่ง:</span>
            <span className="text-danger fw-bold" title="จำเป็นต้องระบุ">*</span>
          </div>
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style={{ fontSize: '10.5px' }}>
            จำเป็น
          </span>
        </label>
        <div className="position-relative">
          <input
            type="text"
            className={`form-control py-2 ps-3 shadow-sm rounded-3 bg-white ${isDeptMissing ? 'is-invalid border-danger' : ''}`}
            placeholder="เช่น ฝ่าย IT / ชั้น 3 / โต๊ะ A1"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ 
              fontSize: '13.5px', 
              border: isDeptMissing ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
              backgroundColor: isDeptMissing ? '#FEF2F2' : '#FFFFFF'
            }}
            required
          />
          {isDeptMissing && (
            <div className="text-danger small mt-1" style={{ fontSize: '11.5px' }}>
              ⚠️ กรุณากรอกแผนกหรือโต๊ะจัดส่ง
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
