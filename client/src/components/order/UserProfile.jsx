import React from 'react';

export default function UserProfile({ user }) {
  if (!user) return null;

  return (
    <div className="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom border-dashed">
      <div className="position-relative" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
        <img 
          src={user.pictureUrl || 'https://via.placeholder.com/80'} 
          alt="Avatar" 
          className="rounded-circle border border-2 border-white shadow-sm w-100 h-100" 
          style={{ objectFit: 'cover' }}
        />
        <div 
          className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-white"
          style={{ width: '20px', height: '20px', fontSize: '10px' }}
        >
          <i className="fa-brands fa-line"></i>
        </div>
      </div>
      <div className="overflow-hidden">
        <small className="text-muted d-block" style={{ fontSize: '12px' }}>สวัสดีคุณ</small>
        <h6 className="mb-0 fw-bold text-dark text-truncate">{user.displayName || 'ผู้สั่งอาหาร'}</h6>
      </div>
    </div>
  );
}
