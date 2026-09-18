import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_AVATAR } from '../../utils/assets';

export default function Navbar({ currentPage, onNavigate }) {
  const { user, isAdmin, adminRole } = useAuth();

  return (
    <nav 
      className="navbar navbar-dark sticky-top py-2 px-3"
      style={{
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Brand */}
        <div 
          className="d-flex align-items-center gap-2 text-decoration-none text-white" 
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('order')}
        >
          <div 
            className="d-flex align-items-center justify-content-center text-white rounded-3" 
            style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #06C755, #05A044)' }}
          >
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div>
            <div className="fw-bold fs-6 lh-1">ระบบสั่งอาหาร</div>
            <small className="text-secondary" style={{ fontSize: '11px' }}>Food Order & Admin</small>
          </div>
        </div>

        {/* User & Navigation */}
        <div className="d-flex align-items-center gap-2">
          {user && (
            <div className="d-none d-sm-flex align-items-center gap-2 bg-secondary bg-opacity-25 px-2 py-1 rounded-pill text-white" style={{ fontSize: '12.5px' }}>
              <img 
                src={user.pictureUrl || DEFAULT_AVATAR} 
                alt="Profile" 
                className="rounded-circle border border-success" 
                style={{ width: '26px', height: '26px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <span className="text-truncate" style={{ maxWidth: '120px' }}>{user.displayName}</span>
              {isAdmin && <span className="badge bg-success" style={{ fontSize: '10px' }}>{adminRole || 'Admin'}</span>}
            </div>
          )}

          {currentPage === 'order' ? (
            isAdmin ? (
              <button 
                type="button" 
                className="btn btn-sm btn-outline-success text-white border-success d-flex align-items-center justify-content-center rounded-3 shadow-sm" 
                style={{ width: '38px', height: '38px', fontSize: '15px' }}
                onClick={() => onNavigate('admin')}
                title="เข้าสู่ระบบจัดการผู้ดูแล"
                aria-label="จัดการระบบ"
              >
                <i className="fa-solid fa-gear"></i>
              </button>
            ) : null
          ) : (
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center rounded-3 shadow-sm" 
              style={{ width: '38px', height: '38px', fontSize: '15px' }}
              onClick={() => onNavigate('order')}
              title="กลับไปยังหน้าสั่งอาหาร"
              aria-label="หน้าสั่งอาหาร"
            >
              <i className="fa-solid fa-bowl-food"></i>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
