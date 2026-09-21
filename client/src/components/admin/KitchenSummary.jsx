import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * แจกแจงรายการเมนูจากสตริง เช่น "ข้าวผัดหมู x 1, ข้าวกะเพราหมูกรอบ (พิเศษ) x 2"
 */
function parseDishEntries(rawMenuName, fallbackQty) {
  if (!rawMenuName) return [];
  const entries = [];
  const parts = rawMenuName.includes(',') ? rawMenuName.split(/,\s*/) : [rawMenuName];
  parts.forEach((part) => {
    const p = part.trim();
    if (!p) return;
    const match = p.match(/^(.*?)\s*[xX*]\s*(\d+)$/);
    if (match) {
      entries.push({
        dishName: match[1].trim(),
        qty: parseInt(match[2], 10) || 1,
      });
    } else {
      entries.push({
        dishName: p,
        qty: parts.length === 1 ? (fallbackQty || 1) : 1,
      });
    }
  });
  return entries;
}

export default function KitchenSummary({ orders = [], menus = [], currentRound = '', summary = {} }) {
  // คำนวณสรุป
  let computedBoxes = 0;
  let computedRev = 0;
  const computedKitchenCount = {};

  (orders || []).forEach((o) => {
    const status = String(o.status || '').toLowerCase();
    if (status !== 'cancelled' && status !== 'ยกเลิก') {
      const oQty = Number(o.quantity) || 1;
      const rawMenuName = String(o.menuName || '').trim();
      const dishes = parseDishEntries(rawMenuName, oQty);

      let orderBoxSum = 0;
      dishes.forEach(({ dishName, qty }) => {
        orderBoxSum += qty;
        // ตัดวงเล็บตัวเลือกเสริมออก เช่น "ข้าวกะเพราหมูกรอบ (พิเศษ, +ไข่ดาว)" -> "ข้าวกะเพราหมูกรอบ"
        const baseMenuName = dishName.replace(/\s*\(.*?\)\s*$/, '').trim();

        // ค้นหาเมนูเทียบทั้งแบบเต็มและแบบชื่อฐาน
        const m = (menus || []).find((item) => item.name === dishName || item.name === baseMenuName);
        let unitPrice = m ? (Number(m.price) || 0) : 0;

        // ตรวจสอบและบวกราคาตัวเลือกเสริม
        if (dishName.includes('พิเศษ')) unitPrice += 10;
        if (dishName.includes('ไข่ดาว')) unitPrice += 10;

        computedRev += unitPrice * qty;

        if (o.round === currentRound) {
          computedKitchenCount[dishName] = (computedKitchenCount[dishName] || 0) + qty;
        }
      });

      computedBoxes += (orderBoxSum > 0 ? orderBoxSum : oQty);
    }
  });

  const totalBoxes = summary && summary.totalBoxes !== undefined ? summary.totalBoxes : computedBoxes;
  const totalRev = summary && summary.totalRevenue !== undefined ? summary.totalRevenue : computedRev;
  const totalOrdersCount = summary && summary.totalOrders !== undefined ? summary.totalOrders : orders.length;
  const kitchenCount = (summary && summary.kitchenSummary && Object.keys(summary.kitchenSummary).length > 0)
    ? summary.kitchenSummary
    : computedKitchenCount;

  const kitchenMenuKeys = Object.keys(kitchenCount);

  return (
    <div className="mb-4">
      {/* Stats Cards */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3 fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark lh-1">{totalOrdersCount}</div>
              <small className="text-muted">รายการสั่งทั้งหมด</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-success bg-opacity-10 text-success p-3 fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark lh-1">{totalBoxes}</div>
              <small className="text-muted">จำนวนกล่องรวม</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-warning bg-opacity-10 text-warning p-3 fs-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <i className="fa-solid fa-coins"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark lh-1">{formatCurrency(totalRev)}</div>
              <small className="text-muted">ยอดรวมทั้งสิ้น</small>
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen Chip Box */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25">
        <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold">
          <i className="fa-solid fa-fire-burner"></i>
          <span>สรุปยอดห้องครัว (เฉพาะรอบปัจจุบัน: {currentRound || '-'})</span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {kitchenMenuKeys.length === 0 ? (
            <span className="text-muted small">ยังไม่มีรายการสั่งในรอบนี้</span>
          ) : (
            kitchenMenuKeys.map((menuName) => (
              <div
                key={menuName}
                className="bg-white border border-success border-opacity-25 text-success rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                style={{ fontSize: '13.5px' }}
              >
                <span>{menuName}</span>
                <span className="badge bg-success text-white px-2 py-1">{kitchenCount[menuName]} กล่อง</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
