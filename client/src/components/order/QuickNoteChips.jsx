import React from 'react';

const PRESET_NOTES = [
  { text: 'ไม่เผ็ด', icon: '🌶️' },
  { text: 'เผ็ดน้อย', icon: '🔥' },
  { text: 'พิเศษ', icon: '⭐' },
  { text: 'ไม่ใส่ผัก', icon: '🥬' },
  { text: 'แยกน้ำ', icon: '🥤' },
  { text: 'ไข่ดาว', icon: '🍳' },
];

export default function QuickNoteChips({ note, setNote }) {
  function addNoteChip(chipText) {
    if (!note.trim()) {
      setNote(chipText);
    } else if (!note.includes(chipText)) {
      setNote(`${note}, ${chipText}`);
    }
  }

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-0" style={{ fontSize: '13px' }}>
          <i className="fa-regular fa-comment-dots text-primary"></i>
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
        style={{ fontSize: '13px' }}
      />

      <div className="d-flex flex-wrap gap-1 mt-2">
        {PRESET_NOTES.map((item) => (
          <button
            key={item.text}
            type="button"
            className="note-chip-modern shadow-sm"
            onClick={() => addNoteChip(item.text)}
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
