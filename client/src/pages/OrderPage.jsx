import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getAvailableMenus } from '../services/menuService';
import { submitOrder } from '../services/orderService';
import FoodCatalogGrid from '../components/order/FoodCatalogGrid';
import StickyBottomBar from '../components/order/StickyBottomBar';
import QuantityStepper from '../components/order/QuantityStepper';
import ContactInputs from '../components/order/ContactInputs';
import QuickNoteChips from '../components/order/QuickNoteChips';
import OrderSummary from '../components/order/OrderSummary';
import Loading from '../components/common/Loading';
import { formatCurrency } from '../utils/formatters';

export default function OrderPage() {
  const { user } = useAuth();

  const [menus, setMenus] = useState(() => {
    try {
      const cached = localStorage.getItem('liff_food_order_cache');
      return cached ? JSON.parse(cached).menus || [] : [];
    } catch (e) { return []; }
  });

  const [currentRound, setCurrentRound] = useState(() => {
    try {
      const cached = localStorage.getItem('liff_food_order_cache');
      return cached ? JSON.parse(cached).round || '' : '';
    } catch (e) { return ''; }
  });

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [note, setNote] = useState('');

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('liff_food_order_cache');
      return !(cached && JSON.parse(cached).menus?.length > 0);
    } catch (e) { return true; }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();

    // ดึงเบอร์โทรและแผนกที่เคยบันทึกไว้ในเครื่อง
    try {
      const savedPhone = localStorage.getItem('user_order_phone');
      const savedDept = localStorage.getItem('user_order_dept');
      if (savedPhone) setPhone(savedPhone);
      if (savedDept) setDepartment(savedDept);
    } catch (e) {}
  }, []);

  async function loadData() {
    try {
      const res = await getAvailableMenus();
      if (res.status === 'success') {
        setMenus(res.menus || []);
        setCurrentRound(res.round || '');

        localStorage.setItem(
          'liff_food_order_cache',
          JSON.stringify({ round: res.round, menus: res.menus })
        );
      }
    } catch (err) {
      console.warn("Load menu error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // แตะเลือกเมนู
  function handleSelectMenu(menu) {
    setSelectedMenu(menu);
  }

  async function handleSubmitOrder() {
    if (!selectedMenu) {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ได้เลือกเมนู',
        text: 'กรุณาแตะเลือกรายการอาหารที่ต้องการสั่งก่อนครับ',
        confirmButtonColor: '#06C755',
      });
      return;
    }

    if (currentRound && currentRound.includes('ปิดรับ')) {
      Swal.fire({
        icon: 'info',
        title: 'ปิดรับออเดอร์ชั่วคราว',
        text: 'ขออภัย ขณะนี้ระบบปิดรับออเดอร์สำหรับรอบนี้แล้วครับ',
        confirmButtonColor: '#06C755',
      });
      return;
    }

    const unitPrice = Number(selectedMenu.price) || 0;
    const total = unitPrice * quantity;

    // Pop-up ยืนยันการสั่งซื้อ
    const result = await Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      html: `
        <div style="text-align: left; font-size: 14px; background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">ผู้สั่ง:</span>
            <strong>${user ? user.displayName : 'ผู้สั่งอาหาร'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">เมนู:</span>
            <strong style="color: #0F172A;">${selectedMenu.name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">จำนวน:</span>
            <strong>${quantity} กล่อง</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">เบอร์โทร:</span>
            <span>${phone || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">แผนก/โต๊ะ:</span>
            <span>${department || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">หมายเหตุ:</span>
            <span style="color: #D97706;">${note || '-'}</span>
          </div>
          <hr style="margin: 10px 0; border: 0; border-top: 1px dashed #CBD5E1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #1E293B;">ยอดรวมทั้งสิ้น:</span>
            <strong style="font-size: 18px; color: #05A044;">${formatCurrency(total)}</strong>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันสั่งอาหารทันที',
      cancelButtonText: 'กลับไปแก้ไข',
      confirmButtonColor: '#06C755',
      cancelButtonColor: '#94A3B8',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    // บันทึกเบอร์โทรและแผนกไว้ในเครื่องเพื่อความสะดวกรอบต่อไป
    try {
      if (phone) localStorage.setItem('user_order_phone', phone);
      if (department) localStorage.setItem('user_order_dept', department);
    } catch (e) {}

    try {
      await submitOrder({
        round: currentRound,
        userId: user ? user.userId : '-',
        displayName: user ? user.displayName : 'ผู้สั่งอาหาร',
        pictureUrl: user ? user.pictureUrl : '',
        statusMessage: user ? user.statusMessage : '',
        phone: phone || '-',
        department: department || '-',
        menuName: selectedMenu.name,
        quantity,
        note: note || '-',
      });

      await Swal.fire({
        icon: 'success',
        title: 'บันทึกออเดอร์สำเร็จ!',
        html: `ระบบส่งรายการ <b>${selectedMenu.name}</b> (${quantity} กล่อง) เข้าครัวเรียบร้อยแล้ว`,
        timer: 2200,
        showConfirmButton: false,
      });

      // รีเซ็ตหลังจากสั่งเสร็จ
      setSelectedMenu(null);
      setQuantity(1);
      setNote('');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message || 'ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#06C755',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading && menus.length === 0) {
    return <Loading message="กำลังโหลดรายการอาหาร..." />;
  }

  const isRoundClosed = currentRound && currentRound.includes('ปิดรับ');

  return (
    <div className="order-page-wrapper">
      <div className="container-fluid container-xl py-3 py-md-4">
        {/* Hero Header Banner */}
        <div className="hero-greeting-banner mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 position-relative" style={{ zIndex: 2 }}>
            {/* User Greeting & Avatar */}
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                <img
                  src={user?.pictureUrl || 'https://via.placeholder.com/80'}
                  alt="Avatar"
                  className="rounded-circle border border-3 border-white shadow w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80'; }}
                />
                <div
                  className="position-absolute bottom-0 end-0 bg-white text-success rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '20px', height: '20px', fontSize: '11px', border: '1px solid #10B981' }}
                >
                  <i className="fa-brands fa-line"></i>
                </div>
              </div>
              <div>
                <div className="text-white text-opacity-75 small" style={{ fontSize: '12px' }}>สวัสดีคุณยินดีต้อนรับ ✨</div>
                <h4 className="mb-0 fw-bold text-white text-truncate" style={{ maxWidth: '260px', textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                  {user?.displayName || 'ผู้สั่งอาหาร'}
                </h4>
              </div>
            </div>

            {/* Live Round Badge (Frosted Glass) */}
            <div className={`round-badge-glass d-flex align-items-center gap-2 ${
              isRoundClosed ? 'bg-danger bg-opacity-25 border-danger' : ''
            }`}>
              <span className={`pulse-dot ${isRoundClosed ? 'bg-danger' : 'bg-warning'}`} style={{ width: '10px', height: '10px' }}></span>
              <div>
                <small className="d-block text-white text-opacity-80" style={{ fontSize: '11px', lineHeight: 1.2 }}>
                  {isRoundClosed ? 'สถานะการสั่งซื้อ:' : 'รอบเปิดรับอาหาร:'}
                </small>
                <strong className="text-white" style={{ fontSize: '13.5px' }}>
                  {currentRound || 'รอบปกติ'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Closed notice banner if applicable */}
        {isRoundClosed && (
          <div className="alert alert-warning border-0 rounded-4 shadow-sm mb-3 d-flex align-items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation fs-5 text-warning"></i>
            <div>
              <strong>รอบนี้ปิดรับออเดอร์แล้ว:</strong> ขออภัยในความไม่สะดวก กรุณารอรอบเปิดรับสั่งอาหารในครั้งถัดไป
            </div>
          </div>
        )}

        {/* Main Content Layout: 2 Columns on Desktop, Single Stack on Mobile */}
        <div className="row g-3 g-lg-4">
          {/* Left Column: Food Catalog (65% on Desktop, 100% on Mobile) */}
          <div className="col-12 col-lg-7 col-xl-8">
            <FoodCatalogGrid
              menus={menus}
              selectedMenu={selectedMenu}
              onSelectMenu={handleSelectMenu}
            />

            {/* Mobile-only Customization Box (Order inputs shown under catalog on mobile) */}
            <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 bg-white mb-4 d-lg-none" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div 
                  className="rounded-3 d-flex align-items-center justify-content-center text-white" 
                  style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #FF6B35, #F59E0B)' }}
                >
                  <i className="fa-solid fa-sliders" style={{ fontSize: '13px' }}></i>
                </div>
                <h6 className="fw-bold text-dark mb-0">ระบุรายละเอียดการจัดส่ง</h6>
              </div>

              <QuantityStepper
                quantity={quantity}
                onChangeQuantity={setQuantity}
              />

              <ContactInputs
                phone={phone}
                setPhone={setPhone}
                department={department}
                setDepartment={setDepartment}
              />

              <QuickNoteChips
                note={note}
                setNote={setNote}
              />
            </div>
          </div>

          {/* Right Column: Desktop Sticky Order Panel (35% on Desktop, Hidden on Mobile) */}
          <div className="col-12 col-lg-5 col-xl-4 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 p-4 desktop-sticky-panel bg-white" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm" 
                    style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #06C755, #05A044)' }}
                  >
                    <i className="fa-solid fa-basket-shopping" style={{ fontSize: '15px' }}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">สรุปการสั่งอาหาร</h5>
                </div>
                {selectedMenu && (
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1" style={{ fontSize: '11px' }}>
                    พร้อมสั่ง 1 รายการ
                  </span>
                )}
              </div>

              {/* Selected Menu Preview */}
              {selectedMenu ? (
                <div 
                  className="p-3 rounded-4 mb-3 d-flex flex-row align-items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1.5px solid #10B981',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <div className="rounded-3 overflow-hidden bg-white shadow-sm flex-shrink-0" style={{ width: '64px', height: '64px' }}>
                    {selectedMenu.imageUrl ? (
                      <img
                        src={selectedMenu.imageUrl}
                        alt={selectedMenu.name}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-warning" style={{ background: '#FFFBEB' }}>
                        <i className="fa-solid fa-bowl-food fs-3"></i>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-grow-1">
                    <span className="badge bg-success text-white rounded-pill px-2 py-0 mb-1" style={{ fontSize: '10px' }}>
                      ✓ เลือกแล้ว
                    </span>
                    <h6 className="fw-bold text-dark mb-0 text-truncate">{selectedMenu.name}</h6>
                    <div className="text-success fw-bold" style={{ fontSize: '15px' }}>
                      {formatCurrency(selectedMenu.price)} / กล่อง
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="rounded-4 p-3 text-center mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    border: '2px dashed #F59E0B',
                  }}
                >
                  <div className="fs-3 mb-1">🍱 👈</div>
                  <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>แตะเลือกเมนูที่ต้องการสั่ง</div>
                  <small className="text-secondary" style={{ fontSize: '11.5px' }}>คลิกเลือกเมนูอาหารจากตารางฝั่งซ้ายได้เลยครับ</small>
                </div>
              )}

              {/* Quantity Stepper */}
              <QuantityStepper
                quantity={quantity}
                onChangeQuantity={setQuantity}
              />

              {/* Contact Inputs */}
              <ContactInputs
                phone={phone}
                setPhone={setPhone}
                department={department}
                setDepartment={setDepartment}
              />

              {/* Quick Note Chips */}
              <QuickNoteChips
                note={note}
                setNote={setNote}
              />

              {/* Order Summary & Submit Button */}
              <OrderSummary
                selectedMenu={selectedMenu}
                quantity={quantity}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Bottom Bar for Mobile & LINE UX */}
      <StickyBottomBar
        selectedMenu={selectedMenu}
        quantity={quantity}
        onSubmit={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
