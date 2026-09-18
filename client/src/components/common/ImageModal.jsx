import React from 'react';

export default function ImageModal({ imageUrl, title, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content bg-transparent border-0 shadow-none">
          <div className="d-flex justify-content-between align-items-center mb-2 px-2 text-white">
            <h6 className="mb-0 fw-bold">{title || 'รูปภาพเมนูอาหาร'}</h6>
            <button 
              type="button" 
              className="btn btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-0 text-center">
            <img 
              src={imageUrl} 
              alt={title || 'Preview'} 
              className="img-fluid rounded-3 shadow-lg" 
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
