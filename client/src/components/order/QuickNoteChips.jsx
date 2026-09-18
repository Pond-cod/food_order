import React from 'react';

const PRESET_NOTES = ['ไม่เผ็ด', 'เผ็ดน้อย', 'พิเศษ', 'ไม่ใส่ผัก', 'แยกน้ำ'];

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
      <label className="form-label fw-bold text-dark d-flex align-items-center gap-2 mb-1" style={{ fontSize: '13.5px' }}>
        <i className="fa-regular fa-comment-dots text-info"></i>
        <span>หมายเหตุเพิ่มเติม (ถ้ามี):</span>
      </label>
      <input
        type="text"
        className="form-control py-2 shadow-sm rounded-3"
        placeholder="เช่น ไม่เผ็ด, พิเศษ, ไม่ใส่ผัก, แยกน้ำ"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ fontSize: '13.5px' }}
      />
      <div className="d-flex flex-wrap gap-1 mt-2">
        {PRESET_NOTES.map((text) => (
          <button
            key={text}
            type="button"
            className="chip-btn"
            onClick={() => addNoteChip(text)}
          >
            + {text}
          </button>
        ))}
      </div>
    </div>
  );
}
