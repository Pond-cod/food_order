import React from 'react';

const PRESET_NOTES = [
  { text: 'ไม่เผ็ด', icon: '🌶️', className: 'chip-spicy' },
  { text: 'เผ็ดน้อย', icon: '🔥', className: 'chip-mild' },
  { text: 'พิเศษ', icon: '⭐', className: 'chip-special' },
  { text: 'ไม่ใส่ผัก', icon: '🥬', className: 'chip-veggie' },
  { text: 'แยกน้ำ', icon: '🥤', className: 'chip-drink' },
  { text: 'ไข่ดาว', icon: '🍳', className: 'chip-egg' },
];

export default function QuickNoteChips({ note, setNote }) {
  function toggleNoteChip(chipText) {
    if (!note.trim()) {
      setNote(chipText);
    } else if (note.includes(chipText)) {
      const parts = note.split(',').map(s => s.trim()).filter(s => s && s !== chipText);
      setNote(parts.join(', '));
    } else {
      setNote(`${note}, ${chipText}`);
    }
  }

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-0" style={{ fontSize: '13px' }}>
          <span 
            className="rounded-2 d-flex align-items-center justify-content-center text-white" 
            style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', fontSize: '11px' }}
          >
            <i className="fa-regular fa-comment-dots"></i>
          </span>
          <span>หมายเหตุเพิ่มเติม (ถ้ามี):</span>
        </label>
        {note && (
          <button
            type="button"
            className="btn btn-sm text-muted p-0"
            style={{ fontSize: '11px' }}
            onClick={() => setNote('')}
          >
            ล้างข้อความ
          </button>
        )}
      </div>

      <input
        type="text"
        className="form-control py-2 shadow-sm rounded-3 bg-white"
        placeholder="เช่น ไม่เผ็ด, พิเศษ, ไม่ใส่ผัก, แยกน้ำ"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ fontSize: '13px', border: '1.5px solid #E2E8F0' }}
      />

      <div className="d-flex flex-wrap gap-1 mt-2">
        {PRESET_NOTES.map((item) => {
          const isActive = note.includes(item.text);
          return (
            <button
              key={item.text}
              type="button"
              className={`note-chip-modern ${item.className} ${isActive ? 'active shadow-sm' : 'shadow-sm'}`}
              onClick={() => toggleNoteChip(item.text)}
              title={isActive ? 'แตะเพื่อยกเลิก' : 'แตะเพื่อเลือก'}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
