import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getAvailableMenus } from '../services/menuService';
import { submitOrder } from '../services/orderService';
import UserProfile from '../components/order/UserProfile';
import RoundCard from '../components/order/RoundCard';
import VisualMenuPicker from '../components/order/VisualMenuPicker';
import FoodPreviewCard from '../components/order/FoodPreviewCard';
import MenuDropdown from '../components/order/MenuDropdown';
import QuantityStepper from '../components/order/QuantityStepper';
import ContactInputs from '../components/order/ContactInputs';
import QuickNoteChips from '../components/order/QuickNoteChips';
import OrderSummary from '../components/order/OrderSummary';
import Loading from '../components/common/Loading';

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
      // ดึงข้อมูลอัปเดตล่าสุดจาก Backend API
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

  async function handleSubmitOrder() {
    if (!selectedMenu) {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ได้เลือกเมนู',
        text: 'กรุณาเลือกเมนูอาหารก่อนกดสั่งซื้อครับ',
        confirmButtonColor: '#06C755',
      });
      return;
    }

    const total = selectedMenu.price * quantity;

    // Pop-up ยืนยันการสั่งซื้อ
    const result = await Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      html: `
        <div style="text-align: left; font-size: 14px; background: #F8FAFC; padding: 14px; border-radius: 10px;">
          <p><strong>ผู้สั่ง:</strong> ${user ? user.displayName : 'ผู้สั่งอาหาร'}</p>
          <p><strong>เมนู:</strong> ${selectedMenu.name}</p>
          <p><strong>จำนวน:</strong> ${quantity} กล่อง/ห่อ</p>
          <p><strong>หมายเหตุ:</strong> ${note || '-'}</p>
          <hr style="margin: 8px 0; border: 0; border-top: 1px solid #E2E8F0;">
          <p style="font-size: 16px; color: #05A044; margin-bottom: 0;"><strong>ยอดรวม:</strong> ฿${total.toLocaleString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันสั่งเลย',
      cancelButtonText: 'แก้ไข',
      confirmButtonColor: '#06C755',
      cancelButtonColor: '#94A3B8',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    // บันทึกเบอร์โทรและแผนกไว้ในเครื่อง
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
        html: `ระบบได้รับออเดอร์ <b>${selectedMenu.name}</b> เรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });

      // รีเซ็ตค่าหลังจากสั่งเสร็จ
      setSelectedMenu(null);
      setQuantity(1);
      setNote('');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message || 'ไม่สามารถส่งออเดอร์ได้',
        confirmButtonColor: '#06C755',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading && menus.length === 0) {
    return <Loading message="กำลังโหลดรายการอาหาร..." />;
  }

  return (
    <div className="container py-3" style={{ maxWidth: '480px' }}>
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
        <UserProfile user={user} />
        <RoundCard round={currentRound} />

        <VisualMenuPicker
          menus={menus}
          selectedMenu={selectedMenu}
          onSelectMenu={(menu) => setSelectedMenu(menu)}
        />

        <FoodPreviewCard selectedMenu={selectedMenu} />

        <MenuDropdown
          menus={menus}
          selectedMenu={selectedMenu}
          onChangeMenu={(menu) => setSelectedMenu(menu)}
        />

        <QuantityStepper
          quantity={quantity}
          onChangeQuantity={(q) => setQuantity(q)}
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

        <OrderSummary
          selectedMenu={selectedMenu}
          quantity={quantity}
          onSubmit={handleSubmitOrder}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
