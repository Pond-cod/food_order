import React, { useState, useEffect, useRef } from 'react';
import { compressImageFile } from '../../utils/imageCompressor';

const MENU_PRESETS = [
  { name: "กะเพรา", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80" },
  { name: "ข้าวผัด", url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80" },
  { name: "ผัดไทย", url: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80" },
  { name: "ต้มยำกุ้ง", url: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&auto=format&fit=crop&q=80" },
  { name: "หมูกรอบ", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80" },
  { name: "ส้มตำ", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80" },
  { name: "ชา/กาแฟ", url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80" },
];

export default function MenuModal({ isOpen, onClose, onSave, editingMenu, isSaving }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingMenu) {
      setName(editingMenu.name || '');
      setPrice(editingMenu.price || '');
      setImageUrl(editingMenu.imageUrl || '');
      setImageBase64('');
      setShowUrlInput(Boolean(editingMenu.imageUrl && !editingMenu.imageUrl.startsWith('data:')));
    } else {
      setName('');
      setPrice('');
      setImageUrl('');
      setImageBase64('');
      setShowUrlInput(false);
    }
  }, [editingMenu, isOpen]);

  if (!isOpen) return null;

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      setImageBase64(compressed);
      setImageUrl('');
    } catch (err) {
      alert('ไม่สามารถประมวลผลไฟล์รูปภาพได้');
    }
  }

  function handleClearImage(e) {
    if (e) e.stopPropagation();
    setImageBase64('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSelectPreset(presetUrl) {
    setImageUrl(presetUrl);
    setImageBase64('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || price === '') {
      alert('กรุณากรอกชื่อและราคาให้ครบถ้วน');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('กรุณากรอกราคาเป็นตัวเลขที่มากกว่า 0 บาท');
      return;
    }

    onSave({
      rowIndex: editingMenu ? editingMenu.rowIndex : null,
      name: name.trim(),
      price: numPrice,
      status: editingMenu ? editingMenu.status : 'Available',
      imageUrl,
      imageBase64,
    });
  }

  const previewSource = imageBase64 || imageUrl;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-success text-white py-3">
            <h5 className="modal-title fw-bold fs-6">
              <i className="fa-solid fa-bowl-food me-2"></i>
              {editingMenu ? 'แก้ไขเมนูอาหาร' : 'เพิ่มเมนูอาหารใหม่'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSaving}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* ชื่อเมนู */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                  ชื่อเมนู: <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control py-2 shadow-sm rounded-3"
                  placeholder="เช่น ข้าวผัดกุ้ง"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* ราคา */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                  ราคา (บาท): <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control py-2 shadow-sm rounded-3"
                  placeholder="เช่น 50"
                  value={price}
                  min="1"
                  max="99999"
                  step="1"
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* รูปภาพเมนูอาหาร */}
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold text-dark mb-0 d-flex align-items-center gap-1" style={{ fontSize: '13px' }}>
                    <i className="fa-regular fa-image text-success"></i>
                    <span>รูปภาพเมนูอาหาร:</span>
                  </label>
                  <small className="text-muted" style={{ fontSize: '11px' }}>เก็บใน Drive Folder</small>
                </div>

                {/* กล่องพรีวิวรูปภาพ */}
                <div
                  className="position-relative d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded-3 bg-white mb-2 overflow-hidden"
                  style={{ height: '140px', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="คลิกเพื่อเลือกไฟล์รูปภาพ"
                >
                  {previewSource ? (
                    <>
                      <img
                        src={previewSource}
                        alt="Preview"
                        className="w-100 h-100 object-fit-cover"
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center p-0 shadow"
                        style={{ width: '26px', height: '26px' }}
                        onClick={handleClearImage}
                        title="ลบรูปภาพ"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-muted p-2">
                      <i className="fa-solid fa-cloud-arrow-up text-success fs-2 mb-1"></i>
                      <div className="fw-bold text-dark" style={{ fontSize: '12.5px' }}>คลิกเพื่ออัปโหลดรูปภาพ</div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>ย่อขนาดอัตโนมัติ ไม่เกิน 800px</small>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {/* ปุ่ม Action */}
                <div className="d-flex gap-2 mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-white border flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <i className="fa-solid fa-camera text-secondary"></i>
                    <span>เลือกรูปภาพ</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-white border flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    <i className="fa-solid fa-link text-secondary"></i>
                    <span>ใส่ลิงก์ URL</span>
                  </button>
                </div>

                {/* URL Input */}
                {showUrlInput && (
                  <div className="mb-2">
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="วางลิงก์รูปภาพ เช่น https://..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImageBase64('');
                      }}
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <small className="d-block text-muted mb-1" style={{ fontSize: '11px' }}>
                    <i className="fa-solid fa-wand-magic-sparkles text-warning me-1"></i>
                    หรือเลือกรูปตัวอย่างสำเร็จรูป:
                  </small>
                  <div className="d-flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {MENU_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1 text-nowrap rounded-pill bg-white border"
                        style={{ fontSize: '11px' }}
                        onClick={() => handleSelectPreset(p.url)}
                      >
                        <img src={p.url} alt={p.name} className="rounded-circle" style={{ width: '16px', height: '16px', objectFit: 'cover' }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-light border px-3" onClick={onClose} disabled={isSaving}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-success px-4 fw-bold shadow-sm" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกเมนู</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
