import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ScheduleSettings({ 
  currentRound, 
  allMenus = [], 
  onSaveSchedule, 
  isSaving 
}) {
  // ฟังก์ชันคำนวณวันที่วันนี้ในรูปแบบ YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // แปลง YYYY-MM-DD เป็นวันที่ภาษาไทย
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const thaiMonths = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
        const thaiYear = d.getFullYear() + 543;
        return `${dayNames[d.getDay()]}ที่ ${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYear}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const [roundName, setRoundName] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [autoCombine, setAutoCombine] = useState(true);
  
  // เก็บสถานะการเลือกเมนู { [rowIndex]: boolean }
  const [selectedMenuIds, setSelectedMenuIds] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // แยกชื่อรอบและวันที่เดิมหากมี ตัดวงเล็บวันที่เดิมออกเพื่อป้องกันการซ้ำซ้อน
    const rawRound = currentRound || 'รอบเที่ยง';
    const cleaned = rawRound.replace(/\s*\(\d+\s+[\u0E00-\u0E7Fa-zA-Z.]+\)\s*$/g, '').trim();
    setRoundName(cleaned || rawRound);

    // ตรวจสอบเมนูที่ปัจจุบันเป็น Available ให้ถูกติ๊กเลือกเริ่มต้น
    const initialMap = {};
    allMenus.forEach((m) => {
      initialMap[m.rowIndex] = m.status === 'Available';
    });
    setSelectedMenuIds(initialMap);
  }, [currentRound, allMenus]);

  // คำนวณชื่อรอบที่สมบูรณ์
  const getFullRoundTitle = () => {
    if (!roundName.trim()) return '';
    if (roundName.includes('ปิดรับออเดอร์')) return roundName.trim();
    const baseName = roundName.replace(/\s*\(\d+\s+[\u0E00-\u0E7Fa-zA-Z.]+\)\s*$/g, '').trim();
    if (autoCombine && selectedDate) {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const shortDate = `${d.getDate()} ${thaiMonths[d.getMonth()]}`;
      return `${baseName} (${shortDate})`;
    }
    return baseName || roundName.trim();
  };

  // Toggle การเลือกเมนูเดี่ยว
  const toggleMenu = (rowIndex) => {
    setSelectedMenuIds((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  // เลือกทั้งหมด
  const handleSelectAll = () => {
    const updated = {};
    allMenus.forEach((m) => {
      updated[m.rowIndex] = true;
    });
    setSelectedMenuIds(updated);
  };

  // ไม่เลือกเลย
  const handleDeselectAll = () => {
    const updated = {};
    allMenus.forEach((m) => {
      updated[m.rowIndex] = false;
    });
    setSelectedMenuIds(updated);
  };

  // นับจำนวนเมนูที่เลือก
  const selectedCount = Object.values(selectedMenuIds).filter(Boolean).length;

  // กรองเมนูตามคำค้นหา
  const filteredMenus = allMenus.filter((m) =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRoundTitle = getFullRoundTitle();
    if (!finalRoundTitle) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุชื่อรอบ', text: 'พิมพ์หรือเลือกชื่อรอบก่อนบันทึก' });
      return;
    }

    if (selectedCount === 0 && !finalRoundTitle.includes('ปิดรับ')) {
      Swal.fire({
        title: 'ยังไม่ได้เลือกเมนูเปิดขาย?',
        text: 'ไม่มีเมนูใดถูกเลือกเลย ลูกค้าจะไม่เห็นรายการอาหาร ต้องการบันทึกหรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันบันทึก',
        cancelButtonText: 'กลับไปเลือกเมนู',
      }).then((result) => {
        if (result.isConfirmed) {
          onSaveSchedule({
            roundTitle: finalRoundTitle,
            selectedDate,
            menuStatusMap: selectedMenuIds,
          });
        }
      });
      return;
    }

    onSaveSchedule({
      roundTitle: finalRoundTitle,
      selectedDate,
      menuStatusMap: selectedMenuIds,
    });
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <i className="fa-solid fa-calendar-check text-success"></i>
            <span>กำหนดหน้าสั่งอาหารประจำวัน</span>
          </h4>
          <p className="text-secondary small mb-0">
            กำหนดชื่อรอบ, วันที่ขายจากปฏิทิน และติ๊กเลือกเมนูที่จะเปิดให้ลูกค้าสั่งในรอบนี้
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 bg-success bg-opacity-10 border border-success border-opacity-25 px-3 py-2 rounded-3">
          <span className="pulse-dot"></span>
          <div>
            <small className="text-muted d-block" style={{ fontSize: '11px' }}>รอบปัจจุบันในระบบ:</small>
            <strong className="text-success">{currentRound || 'กำลังโหลด...'}</strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4 mb-4">
          {/* ส่วนที่ 1: กำหนดรอบสั่งอาหาร */}
          <div className="col-12 col-md-6">
            <div className="card h-100 border rounded-3 p-3 bg-light bg-opacity-50">
              <label className="form-label fw-bold d-flex align-items-center gap-2 text-dark mb-2">
                <i className="fa-regular fa-clock text-success"></i>
                <span>1. กำหนดรอบสั่งอาหาร:</span>
              </label>

              <input
                type="text"
                className="form-control form-control-lg bg-white shadow-sm rounded-3 mb-2 fs-6"
                placeholder="เช่น รอบเที่ยง หรือ รอบพิเศษ"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                required
              />

              {/* Presets */}
              <div className="d-flex flex-wrap gap-1 mb-2">
                {['รอบเช้า', 'รอบเที่ยง', 'รอบเย็น'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`btn btn-sm ${roundName === preset ? 'btn-success text-white' : 'btn-white border text-secondary'}`}
                    onClick={() => setRoundName(preset)}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setRoundName('🚫 ปิดรับออเดอร์ชั่วคราว')}
                >
                  🚫 ปิดรับออเดอร์
                </button>
              </div>

              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoCombineSwitch"
                  checked={autoCombine}
                  onChange={(e) => setAutoCombine(e.target.checked)}
                />
                <label className="form-check-label small text-secondary" htmlFor="autoCombineSwitch">
                  นำวันที่มารวมในชื่อรอบอัตโนมัติ (เช่น <code>{getFullRoundTitle()}</code>)
                </label>
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: ปฏิทินเลือกวันที่ */}
          <div className="col-12 col-md-6">
            <div className="card h-100 border rounded-3 p-3 bg-light bg-opacity-50">
              <label className="form-label fw-bold d-flex align-items-center gap-2 text-dark mb-2">
                <i className="fa-regular fa-calendar-days text-primary"></i>
                <span>2. เลือกวันที่จากปฏิทิน:</span>
              </label>

              <div className="d-flex gap-2 mb-2">
                <input
                  type="date"
                  className="form-control form-control-lg bg-white shadow-sm rounded-3 fs-6"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-primary text-nowrap px-3"
                  onClick={() => setSelectedDate(getTodayStr())}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary text-nowrap px-3"
                  onClick={() => setSelectedDate(getTomorrowStr())}
                >
                  พรุ่งนี้
                </button>
              </div>

              <div className="bg-white border rounded-3 p-2 text-center text-primary fw-semibold small">
                <i className="fa-regular fa-calendar-check me-1"></i>
                {formatThaiDate(selectedDate) || 'กรุณาเลือกวันที่'}
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3: เลือกเมนูมาแสดงในรอบนั้นๆ */}
        <div className="card border rounded-3 p-3 mb-4 bg-light bg-opacity-25">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <label className="form-label fw-bold fs-6 d-flex align-items-center gap-2 text-dark mb-0">
                <i className="fa-solid fa-list-check text-success"></i>
                <span>3. กำหนดเมนูที่เปิดขายในรอบนี้</span>
                <span className="badge bg-success rounded-pill px-2">
                  เปิดขาย {selectedCount} / {allMenus.length} เมนู
                </span>
              </label>
              <small className="text-secondary d-block mt-1">
                ติ๊กถูกหน้ารายการเมนูที่ต้องการเปิดให้ลูกค้าสั่งในรอบนี้ (เมนูที่ไม่ติ๊กจะถูกปิดขาย)
              </small>
            </div>

            {/* Quick Actions & Search */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-success fw-semibold"
                onClick={handleSelectAll}
              >
                <i className="fa-solid fa-check-double me-1"></i>
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-semibold"
                onClick={handleDeselectAll}
              >
                <i className="fa-solid fa-xmark me-1"></i>
                ล้างการเลือก
              </button>
              <div className="position-relative" style={{ maxWidth: '180px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm ps-4 rounded-pill"
                  placeholder="ค้นหาเมนู..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: '10px', top: '9px', fontSize: '11px' }}></i>
              </div>
            </div>
          </div>

          {/* Menus Checkbox Grid */}
          <div className="row g-2" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {filteredMenus.length === 0 ? (
              <div className="col-12 text-center text-muted py-4">
                <i className="fa-solid fa-box-open fs-3 d-block mb-2"></i>
                ไม่พบรายการเมนูอาหาร
              </div>
            ) : (
              filteredMenus.map((menu) => {
                const isChecked = !!selectedMenuIds[menu.rowIndex];
                return (
                  <div key={menu.rowIndex} className="col-12 col-sm-6 col-lg-4">
                    <div
                      className={`card h-100 border p-2 rounded-3 d-flex flex-row align-items-center gap-2 transition-all ${
                        isChecked 
                          ? 'border-success bg-success bg-opacity-10 shadow-sm' 
                          : 'bg-white opacity-75'
                      }`}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleMenu(menu.rowIndex)}
                    >
                      {/* Checkbox */}
                      <div className="form-check ms-1 me-1 mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handle by card click
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                      </div>

                      {/* Image Thumbnail */}
                      <div 
                        className="rounded-2 overflow-hidden bg-light flex-shrink-0" 
                        style={{ width: '48px', height: '48px' }}
                      >
                        {menu.imageUrl ? (
                          <img
                            src={menu.imageUrl}
                            alt={menu.name}
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                            <i className="fa-solid fa-bowl-rice"></i>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="overflow-hidden flex-grow-1">
                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '13.5px' }}>
                          {menu.name}
                        </div>
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <span className="text-success fw-bold" style={{ fontSize: '12.5px' }}>
                            ฿{Number(menu.price).toLocaleString()}
                          </span>
                          <span className={`badge ${isChecked ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '10px' }}>
                            {isChecked ? 'เปิดขาย' : 'ปิดขาย'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn btn-success px-4 py-2 fw-bold shadow d-flex align-items-center gap-2 rounded-3 fs-6"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>กำลังบันทึกหน้าสั่งอาหาร...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>บันทึกการตั้งค่าหน้าสั่งอาหาร</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
