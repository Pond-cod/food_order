import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getAvailableMenus } from '../services/menuService';
import { submitOrder } from '../services/orderService';
import FoodCatalogGrid from '../components/order/FoodCatalogGrid';
import StickyBottomBar from '../components/order/StickyBottomBar';
import ContactInputs from '../components/order/ContactInputs';
import QuickNoteChips from '../components/order/QuickNoteChips';
import OrderSummary from '../components/order/OrderSummary';
import Loading from '../components/common/Loading';
import { formatCurrency } from '../utils/formatters';
import { DEFAULT_AVATAR } from '../utils/assets';

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

  // ระบบตะกร้าสินค้า (Cart State): { [menuName]: { menu, quantity } }
  const [cart, setCart] = useState({});
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [note, setNote] = useState('');
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

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
        // UX-02: ตรวจสอบว่าใช้ข้อมูลสำรอง (offline fallback) หรือไม่
        setIsOfflineFallback(!!res.isOfflineFallback);

        // อัปเดต cache เฉพาะเมื่อได้ข้อมูลจริง ไม่ใช่จาก fallback
        if (!res.isOfflineFallback) {
          localStorage.setItem(
            'liff_food_order_cache',
            JSON.stringify({ round: res.round, menus: res.menus })
          );
        }
      }
    } catch (err) {
      console.warn("Load menu error:", err);
    } finally {
      setIsLoading(false);
    }
  }


  // BUG-01 Fix: ใช้ menu.id || menu.name เป็น cart key เพื่อป้องกัน collision
  function getCartKey(menu) {
    return String(menu.id || menu.name || 'unknown');
  }

  // เพิ่มเมนูลงตะกร้า (เริ่มที่ 1 กล่อง)
  function handleAddToCart(menu) {
    const key = getCartKey(menu);
    setCart((prev) => {
      const existing = prev[key];
      if (existing) {
        return {
          ...prev,
          [key]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [key]: { menu, quantity: 1, isExtra: false, hasEgg: false },
      };
    });
  }

  // สลับตัวเลือกเสริม (เช่น พิเศษ, ไข่ดาว)
  function handleToggleOption(menuKey, optionKey) {
    setCart((prev) => {
      const existing = prev[menuKey];
      if (!existing) return prev;
      return {
        ...prev,
        [menuKey]: {
          ...existing,
          [optionKey]: !existing[optionKey],
        },
      };
    });
  }

  // ปรับเพิ่ม/ลดจำนวนในตะกร้า
  function handleUpdateQuantity(menuKey, delta) {
    setCart((prev) => {
      const existing = prev[menuKey];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[menuKey];
        return next;
      }
      return {
        ...prev,
        [menuKey]: { ...existing, quantity: newQty },
      };
    });
  }

  // ลบรายการออกจากตะกร้า
  function handleRemoveFromCart(menuKey) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[menuKey];
      return next;
    });
  }

  // ล้างตะกร้าทั้งหมด
  function handleClearCart() {
    setCart({});
  }

  // คำนวณราคาต่อหน่วยรวมตัวเลือกเสริม
  function getItemUnitPrice(item) {
    const base = Number(item.menu.price) || 0;
    const extra = item.isExtra ? 10 : 0;
    const egg = item.hasEgg ? 10 : 0;
    return base + extra + egg;
  }

  function getItemDisplayName(item) {
    const tags = [];
    if (item.isExtra) tags.push('พิเศษ');
    if (item.hasEgg) tags.push('+ไข่ดาว');
    return tags.length > 0 ? `${item.menu.name} (${tags.join(', ')})` : item.menu.name;
  }

  // คำนวณสรุปยอดตะกร้า
  const cartItems = Object.values(cart);
  const totalBoxes = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * getItemUnitPrice(item)), 0);

  async function handleSubmitOrder() {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่มีรายการในตะกร้า',
        text: 'กรุณาแตะปุ่ม "+ เพิ่ม" ที่เมนูอาหารที่ต้องการสั่งก่อนครับ',
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

    // Pop-up ยืนยันการสั่งซื้อแบบแจกแจงรายการทั้งหมด
    const result = await Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      html: `
        <div style="text-align: left; font-size: 13.5px; background: #F8FAFC; padding: 16px; border-radius: 14px; border: 1.5px solid #E2E8F0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">ผู้สั่ง:</span>
            <strong>${user ? user.displayName : 'ผู้สั่งอาหาร'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">เบอร์โทร:</span>
            <span style="color: ${phone ? '#1E293B' : '#EF4444'}; font-weight: ${phone ? '500' : 'bold'};">${phone || 'ไม่ได้ระบุ'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">แผนก/โต๊ะ:</span>
            <span style="color: ${department ? '#1E293B' : '#EF4444'}; font-weight: ${department ? '500' : 'bold'};">${department || 'ไม่ได้ระบุ'}</span>
          </div>
          ${(!phone && !department) ? '<div style="color: #B45309; font-size: 11.5px; background: #FEF3C7; padding: 6px 10px; border-radius: 8px; margin-bottom: 6px;">💡 แนะนำ: กรอกเบอร์โทรหรือแผนก เพื่อให้จัดส่งได้ถูกต้อง</div>' : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748B;">หมายเหตุ:</span>
            <span style="color: #D97706;">${note || '-'}</span>
          </div>
          <hr style="margin: 10px 0; border: 0; border-top: 1px dashed #CBD5E1;">
          <div style="font-weight: bold; color: #1E293B; margin-bottom: 6px;">รายการที่สั่ง (${cartItems.length} เมนู):</div>
          <div style="max-height: 160px; overflow-y: auto; margin-bottom: 8px;">
            ${cartItems.map(it => {
              const uPrice = getItemUnitPrice(it);
              const tags = [];
              if (it.isExtra) tags.push('พิเศษ');
              if (it.hasEgg) tags.push('+ไข่ดาว');
              const tagDisplay = tags.length > 0 ? ` <span style="color: #D97706; font-size: 11.5px; font-weight: 600;">(${tags.join(', ')})</span>` : '';
              return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                  <span>• <strong>${it.menu.name}</strong>${tagDisplay} <b style="color: #05A044;">x${it.quantity}</b></span>
                  <strong>฿${(uPrice * it.quantity).toLocaleString()}</strong>
                </div>
              `;
            }).join('')}
          </div>
          <hr style="margin: 8px 0; border: 0; border-top: 1.5px solid #CBD5E1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #1E293B;">ยอดรวมทั้งสิ้น (${totalBoxes} กล่อง):</span>
            <strong style="font-size: 19px; color: #05A044;">${formatCurrency(totalPrice)}</strong>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `ยืนยันสั่ง (${formatCurrency(totalPrice)})`,
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
        note: note || '-',
        items: cartItems.map(it => {
          const uPrice = getItemUnitPrice(it);
          return {
            menuName: getItemDisplayName(it),
            baseMenuName: it.menu.name,
            quantity: it.quantity,
            price: uPrice,
            isExtra: Boolean(it.isExtra),
            hasEgg: Boolean(it.hasEgg),
            note: note || '-',
          };
        }),
        menuName: cartItems.map(it => `${getItemDisplayName(it)} x${it.quantity}`).join(', '),
        quantity: totalBoxes,
      });

      await Swal.fire({
        icon: 'success',
        title: 'บันทึกออเดอร์สำเร็จ!',
        html: `ระบบส่งรายการอาหาร <b>${cartItems.length} เมนู (${totalBoxes} กล่อง)</b> เข้าครัวเรียบร้อยแล้ว`,
        timer: 2400,
        showConfirmButton: false,
      });

      // ล้างตะกร้าหลังจากสั่งเสร็จ
      setCart({});
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
                  src={user?.pictureUrl || DEFAULT_AVATAR}
                  alt="Avatar"
                  className="rounded-circle border border-3 border-white shadow w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
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

        {/* Offline Fallback Banner — UX-02 */}
        {isOfflineFallback && (
          <div className="alert border-0 rounded-4 shadow-sm mb-3 d-flex align-items-center gap-2" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '1px solid #FDBA74' }}>
            <i className="fa-solid fa-wifi fs-5" style={{ color: '#F97316' }}></i>
            <div>
              <strong style={{ color: '#C2410C' }}>ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้:</strong>{' '}
              <span style={{ color: '#7C2D12', fontSize: '13px' }}>กำลังแสดงเมนูจากข้อมูลที่บันทึกไว้ล่าสุด กรุณารีเฟรชหน้าเพื่อโหลดเมนูล่าสุด</span>
            </div>
            <button
              type="button"
              className="btn btn-sm ms-auto text-nowrap"
              style={{ background: '#F97316', color: 'white', fontSize: '12px', borderRadius: '8px' }}
              onClick={() => { setIsOfflineFallback(false); loadData(); }}
            >
              <i className="fa-solid fa-rotate me-1"></i>รีเฟรช
            </button>
          </div>
        )}

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
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onToggleOption={handleToggleOption}
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
                <h6 className="fw-bold text-dark mb-0">ข้อมูลจัดส่ง & หมายเหตุ</h6>
              </div>

              {/* Mobile Cart Items Preview if items exist */}
              {cartItems.length > 0 && (
                <div className="mb-3 p-2 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="small fw-bold text-dark">
                      🛒 ตะกร้าของคุณ ({cartItems.length} เมนู, {totalBoxes} กล่อง):
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm text-danger p-0 border-0"
                      style={{ fontSize: '11px' }}
                      onClick={handleClearCart}
                    >
                      ล้างตะกร้า
                    </button>
                  </div>
                  {cartItems.map((it) => {
                    const itemKey = getCartKey(it.menu);
                    const uPrice = getItemUnitPrice(it);
                    return (
                      <div key={itemKey} className="bg-white p-2 rounded-2 mb-2 border shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div>
                            <span className="text-dark small text-truncate fw-semibold d-block" style={{ maxWidth: '140px' }}>
                              {it.menu.name}
                            </span>
                            {(it.isExtra || it.hasEgg) && (
                              <div className="d-flex gap-1 mt-1">
                                {it.isExtra && (
                                  <span className="badge bg-warning text-dark py-0 px-1" style={{ fontSize: '9.5px' }}>
                                    ⭐ พิเศษ
                                  </span>
                                )}
                                {it.hasEgg && (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success py-0 px-1" style={{ fontSize: '9.5px' }}>
                                    🍳 +ไข่ดาว
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="card-mini-stepper">
                              <button
                                type="button"
                                className="card-mini-stepper-btn minus"
                                onClick={() => handleUpdateQuantity(itemKey, -1)}
                              >
                                <i className="fa-solid fa-minus"></i>
                              </button>
                              <span className="card-mini-stepper-count">{it.quantity}</span>
                              <button
                                type="button"
                                className="card-mini-stepper-btn plus"
                                onClick={() => handleUpdateQuantity(itemKey, 1)}
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                            </div>
                            <span className="fw-bold text-success small" style={{ minWidth: '48px', textAlign: 'right' }}>
                              ฿{(uPrice * it.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Option Chips */}
                        <div className="d-flex gap-1 pt-1 border-top border-light">
                          <button
                            type="button"
                            className={`card-mini-option-btn ${it.isExtra ? 'active' : ''}`}
                            onClick={() => handleToggleOption(itemKey, 'isExtra')}
                          >
                            ⭐ {it.isExtra ? 'พิเศษ (+10)' : 'พิเศษ'}
                          </button>
                          <button
                            type="button"
                            className={`card-mini-option-btn ${it.hasEgg ? 'active' : ''}`}
                            onClick={() => handleToggleOption(itemKey, 'hasEgg')}
                          >
                            🍳 {it.hasEgg ? '+ไข่ดาว (+10)' : '+ไข่ดาว'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
                  <h5 className="fw-bold text-dark mb-0">ตะกร้าสั่งอาหาร</h5>
                </div>
                {cartItems.length > 0 && (
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1" style={{ fontSize: '11px' }}>
                    {totalBoxes} กล่อง
                  </span>
                )}
              </div>

              {/* Cart Items List & Total */}
              <OrderSummary
                cartItems={cartItems}
                totalBoxes={totalBoxes}
                totalPrice={totalPrice}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onToggleOption={handleToggleOption}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
              />

              <hr className="my-3" style={{ borderColor: '#E2E8F0' }} />

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
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Bottom Bar for Mobile & LINE UX */}
      <StickyBottomBar
        cartItems={cartItems}
        totalBoxes={totalBoxes}
        totalPrice={totalPrice}
        onSubmit={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
