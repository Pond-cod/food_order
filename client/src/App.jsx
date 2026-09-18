import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('order');

  useEffect(() => {
    // ตรวจสอบ URL query หรือ hash เพื่อสลับหน้า
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('admin') || hash === '#admin') {
      setCurrentPage('admin');
    }
  }, []);

  function handleNavigate(page) {
    setCurrentPage(page);
    window.location.hash = page === 'admin' ? '#admin' : '#order';
  }

  return (
    <AuthProvider>
      <div className="min-vh-100 d-flex flex-column bg-light">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-grow-1">
          {currentPage === 'order' ? (
            <OrderPage />
          ) : (
            <AdminPage onNavigateOrder={() => handleNavigate('order')} />
          )}
        </main>
      </div>
    </AuthProvider>
  );
}
