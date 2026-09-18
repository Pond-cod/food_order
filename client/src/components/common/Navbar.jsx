import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ currentPage, onNavigate }) {
  const { user, isAdmin, adminRole } = useAuth();

  return (
    <nav className="navbar navbar-dark bg-dark sticky-top shadow-sm py-2 px-3">
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
                src={user.pictureUrl || 'https://via.placeholder.com/40'} 
                alt="Profile" 
                className="rounded-circle border border-success" 
                style={{ width: '26px', height: '26px', objectFit: 'cover' }}
              />
              <span className="text-truncate" style={{ maxWidth: '120px' }}>{user.displayName}</span>
              {isAdmin && <span className="badge bg-success" style={{ fontSize: '10px' }}>{adminRole || 'Admin'}</span>}
            </div>
          )}

          {currentPage === 'order' ? (
            isAdmin && (
              <button 
                type="button" 
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 text-white border-success" 
                style={{ fontSize: '12.5px' }}
                onClick={() => onNavigate('admin')}
              >
                <i className="fa-solid fa-gear"></i>
                <span className="d-none d-md-inline">จัดการระบบ</span>
              </button>
            )
          ) : (
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" 
              style={{ fontSize: '12.5px' }}
              onClick={() => onNavigate('order')}
            >
              <i className="fa-solid fa-bowl-food"></i>
              <span>หน้าสั่งอาหาร</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
