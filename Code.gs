/**
 * ====================================================================
 * ระบบสั่งอาหารผ่าน LINE LIFF - Google Apps Script Backend (API)
 * รองรับทั้งฝั่งลูกค้า (สั่งอาหาร) และระบบหลังบ้าน (Admin Dashboard)
 * เชื่อมต่อกับ Google Sheets: Menu, Settings, Orders, Admins
 * ====================================================================
 */

// ใส่ ID ของ Google Spreadsheet
const SPREADSHEET_ID = "1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo";

// ใส่ ID ของ Google Drive Folder สำหรับเก็บรูปภาพเมนูอาหาร
const DRIVE_FOLDER_ID = "1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR";

/**
 * ดึง Spreadsheet Object
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.warn("Cannot open by ID, falling back to active spreadsheet: " + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ฟังก์ชันตรวจสอบสิทธิ์ Admin จากชีท 'Admins'
 */
function checkAdminUser(ss, userId, displayName) {
  if (!userId) return { isAdmin: false };

  let adminSheet = ss.getSheetByName("Admins");
  if (!adminSheet) {
    // สร้างชีท Admins อัตโนมัติหากยังไม่มี
    adminSheet = ss.insertSheet("Admins");
    adminSheet.appendRow(["UserId", "DisplayName", "Role", "CreatedAt"]);
  }

  const data = adminSheet.getDataRange().getValues();
  
  // หากชีทว่าง (มีแค่หัวตาราง) ให้สิทธิ์ผู้ใช้คนแรกที่เข้ามาเป็น SuperAdmin ทันที
  if (data.length <= 1) {
    const now = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    adminSheet.appendRow([userId, displayName || "SuperAdmin", "SuperAdmin", now]);
    return { isAdmin: true, role: "SuperAdmin", displayName: displayName || "SuperAdmin" };
  }

  // ตรวจสอบในรายชื่อแถวที่ 2 เป็นต้นไป
  for (let i = 1; i < data.length; i++) {
    const rowUserId = String(data[i][0] || "").trim();
    if (rowUserId === String(userId).trim()) {
      const status = String(data[i][4] || "Active").trim();
      if (status.toLowerCase() === "inactive" || status === "ปิดใช้งาน") {
        return {
          isAdmin: false,
          isInactive: true,
          role: String(data[i][2] || "Admin"),
          displayName: String(data[i][1] || ""),
          message: "สิทธิ์ผู้ดูแลระบบของคุณถูกปิดใช้งานชั่วคราว"
        };
      }

      let rawRole = String(data[i][2] || "Admin").trim();
      let normRole = "Admin";
      if (rawRole.toLowerCase() === "superadmin") normRole = "SuperAdmin";
      else if (rawRole.toLowerCase() === "cook" || rawRole.toLowerCase() === "kitchen") normRole = "Cook";
      else normRole = "Admin";

      return {
        isAdmin: true,
        role: normRole,
        displayName: String(data[i][1] || "")
      };
    }
  }

  return { isAdmin: false };
}

/**
 * GET Request: จัดการคำขอทั้งฝั่งลูกค้าและหลังบ้าน
 */
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    if (!ss) throw new Error("ไม่สามารถเปิด Google Spreadsheet ได้");

    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAppData";
    const userId = e && e.parameter ? e.parameter.userId : "";
    const displayName = e && e.parameter ? e.parameter.displayName : "";

    // -------------------------------------------------------------
    // Action: checkAdmin (ตรวจสอบสิทธิ์ Admin)
    // -------------------------------------------------------------
    if (action === "checkAdmin") {
      const adminCheck = checkAdminUser(ss, userId, displayName);
      return jsonResponse({
        status: "success",
        isAdmin: adminCheck.isAdmin,
        role: adminCheck.role || "",
        displayName: adminCheck.displayName || ""
      });
    }

    // -------------------------------------------------------------
    // Action: getAdminDashboard (ดึงข้อมูลสำหรับหน้าจอ Admin ทั้งหมด)
    // -------------------------------------------------------------
    if (action === "getAdminDashboard") {
      const adminCheck = checkAdminUser(ss, userId, displayName);
      if (!adminCheck.isAdmin) {
        return jsonResponse({
          status: "error",
          code: 403,
          message: "ขออภัย คุณไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล (Unauthorized)"
        });
      }

      const scriptCache = CacheService.getScriptCache();
      const cachedDash = scriptCache.get("admin_dash_cache");
      if (cachedDash) {
        return ContentService.createTextOutput(cachedDash)
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 1. รอบปัจจุบัน
      let currentRound = "รอบปกติ";
      const settingsSheet = ss.getSheetByName("Settings");
      if (settingsSheet) {
        const sData = settingsSheet.getDataRange().getValues();
        for (let i = 0; i < sData.length; i++) {
          const key = String(sData[i][0]).trim().toLowerCase();
          if (key === "currentround" || key === "รอบปัจจุบัน") {
            currentRound = String(sData[i][1]).trim() || currentRound;
            break;
          }
        }
      }

      // 2. เมนูทั้งหมด (ทั้ง Available และ Sold Out)
      const allMenus = [];
      const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
      if (menuSheet) {
        const mData = menuSheet.getDataRange().getValues();
        for (let i = 1; i < mData.length; i++) {
          const row = mData[i];
          const name = String(row[0] || "").trim();
          if (name) {
            const price = Number(row[1]) || 0;
            const status = String(row[2] || "").trim();
            const imageUrl = String(row[3] || "").trim();
            allMenus.push({
              rowIndex: i + 1,
              name: name,
              price: price,
              status: (status.toLowerCase() === "sold out" || status === "ปิดขาย") ? "Sold Out" : "Available",
              imageUrl: imageUrl
            });
          }
        }
      }

      // 3. รายการออเดอร์ (Orders)
      const orders = [];
      const kitchenSummary = {};
      const orderSheet = ss.getSheetByName("Orders");
      if (orderSheet) {
        const oData = orderSheet.getDataRange().getValues();
        // สรุปยอดครัวรอบปัจจุบัน และดึงเฉพาะ 100 รายการล่าสุดเพื่อความรวดเร็วสูงสุด
        const maxOrders = 100;
        const startRow = Math.max(1, oData.length - maxOrders);
        for (let i = oData.length - 1; i >= 1; i--) {
          const row = oData[i];
          const oRound = String(row[1] || "").trim();
          const oMenu = String(row[4] || "").trim();
          const oQty = parseInt(row[5], 10) || 1;
          const oStatus = String(row[7] || "Pending").trim();

          // สรุปยอดครัว (เฉพาะรอบปัจจุบัน และไม่ยกเลิก)
          if (oRound === currentRound && oStatus !== "Cancelled") {
            kitchenSummary[oMenu] = (kitchenSummary[oMenu] || 0) + oQty;
          }

          // เก็บเฉพาะ 100 รายการล่าสุดเพื่อส่งกลับหน้าเว็บ
          if (i >= startRow) {
            let rawTs = row[0];
            let formattedTs = "";
            if (rawTs instanceof Date) {
              formattedTs = Utilities.formatDate(rawTs, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
            } else {
              formattedTs = String(rawTs || "");
            }

            orders.push({
              rowIndex: i + 1,
              timestamp: formattedTs,
              round: oRound,
              userId: String(row[2] || ""),
              displayName: String(row[3] || "ไม่ระบุชื่อ"),
              menuName: oMenu,
              quantity: oQty,
              note: String(row[6] || "-"),
              status: oStatus,
              pictureUrl: String(row[8] || ""),
              phone: String(row[9] || "-"),
              department: String(row[10] || "-"),
              statusMessage: String(row[11] || "-")
            });
          }
        }
      }

      // 4. รายชื่อ Admin
      const admins = [];
      const adminSheet = ss.getSheetByName("Admins");
      if (adminSheet) {
        const aData = adminSheet.getDataRange().getValues();
        for (let i = 1; i < aData.length; i++) {
          if (aData[i][0]) {
            admins.push({
              rowIndex: i + 1,
              userId: String(aData[i][0]),
              displayName: String(aData[i][1] || ""),
              role: String(aData[i][2] || "Admin"),
              createdAt: String(aData[i][3] || ""),
              status: String(aData[i][4] || "Active").trim()
            });
          }
        }
      }

      const dashResponse = {
        status: "success",
        data: {
          currentRound: currentRound,
          menus: allMenus,
          orders: orders,
          kitchenSummary: kitchenSummary,
          admins: admins,
          adminRole: adminCheck.role
        }
      };

      const dashString = JSON.stringify(dashResponse);
      try {
        scriptCache.put("admin_dash_cache", dashString, 15);
      } catch (e) {}

      return ContentService.createTextOutput(dashString)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // Action: getAppData (ค่าเริ่มต้นสำหรับหน้าลูกค้าสั่งอาหาร - รองรับ CacheService ความเร็วสูง)
    // -------------------------------------------------------------
    const scriptCache = CacheService.getScriptCache();
    const cachedAppData = scriptCache.get("appData_fast_cache");
    if (cachedAppData) {
      return ContentService.createTextOutput(cachedAppData)
        .setMimeType(ContentService.MimeType.JSON);
    }

    let currentRound = "รอบปกติ";
    const settingsSheet = ss.getSheetByName("Settings");
    if (settingsSheet) {
      const data = settingsSheet.getDataRange().getValues();
      for (let i = 0; i < data.length; i++) {
        const key = String(data[i][0]).trim().toLowerCase();
        if (key === "currentround" || key === "รอบปัจจุบัน") {
          currentRound = String(data[i][1]).trim() || currentRound;
          break;
        }
      }
      if (currentRound === "รอบปกติ" && data.length > 0 && data[0].length > 1 && data[0][1]) {
        currentRound = String(data[0][1]).trim();
      }
    }

    const availableMenus = [];
    const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
    if (menuSheet) {
      const menuData = menuSheet.getDataRange().getValues();
      for (let i = 1; i < menuData.length; i++) {
        const row = menuData[i];
        const name = String(row[0] || "").trim();
        const price = Number(row[1]) || 0;
        const status = String(row[2] || "").trim().toLowerCase();
        const imageUrl = String(row[3] || "").trim();

        if (name && (status === "available" || status === "พร้อมขาย" || status === "")) {
          availableMenus.push({
            id: i,
            name: name,
            price: price,
            imageUrl: imageUrl
          });
        }
      }
    }

    const appDataResult = {
      status: "success",
      round: currentRound,
      menus: availableMenus,
      timestamp: new Date().toISOString()
    };

    // แคชข้อมูลไว้ใน Google RAM 180 วินาที เพื่อตอบสนองทันทีใน ~200ms
    try {
      scriptCache.put("appData_fast_cache", JSON.stringify(appDataResult), 180);
    } catch (cErr) {}

    return jsonResponse(appDataResult);

  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล"
    });
  }
}

/**
 * POST Request: จัดการการบันทึกออเดอร์ลูกค้า และคำสั่งแก้ไขระบบหลังบ้าน
 */
function doPost(e) {
  try {
    const ss = getSpreadsheet();
    if (!ss) throw new Error("ไม่สามารถเปิด Google Spreadsheet ได้");

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error("ไม่มีข้อมูลส่งเข้ามา");
    }

    const action = payload.action || "order"; // ถ้าไม่ระบุ action ถือเป็นการสั่งอาหารของลูกค้า

    // เคลียร์ Cache ทันทีเมื่อมีคำสั่งเขียน/แก้ไขข้อมูล เพื่อให้ลูกค้าและแอดมินเห็นข้อมูลล่าสุดทันที
    try {
      CacheService.getScriptCache().remove("appData_fast_cache");
      CacheService.getScriptCache().remove("admin_dash_cache");
    } catch (cacheErr) {}

    // -------------------------------------------------------------
    // Action: order (ลูกค้าสั่งอาหาร - รองรับทั้งหลายเมนูในตะกร้าและแบบเมนูเดี่ยว)
    // -------------------------------------------------------------
    if (action === "order") {
      const round = payload.round || "-";
      const userId = payload.userId || "-";
      const displayName = payload.displayName || "ผู้ใช้ไม่ระบุชื่อ";
      const pictureUrl = payload.pictureUrl || "";
      const phone = payload.phone || "-";
      const department = payload.department || "-";
      const statusMessage = payload.statusMessage || "-";
      const generalNote = payload.note || "-";
      const timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      const status = "Pending";

      // แยกรายการเมนูอาหาร: รองรับทั้ง items array และ menuName แบบเดี่ยว
      let orderItems = [];
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        orderItems = payload.items;
      } else if (payload.menuName) {
        orderItems = [{
          menuName: payload.menuName,
          quantity: parseInt(payload.quantity, 10) || 1,
          note: generalNote
        }];
      }

      // กรองเฉพาะรายการที่ถูกต้อง
      const validItems = orderItems.filter(it => it && it.menuName && String(it.menuName).trim() !== "");
      if (validItems.length === 0) {
        throw new Error("กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ");
      }

      let orderSheet = ss.getSheetByName("Orders");
      if (!orderSheet) {
        orderSheet = ss.insertSheet("Orders");
        orderSheet.appendRow([
          "Timestamp", "Round", "UserId", "DisplayName", "MenuName", "Quantity", "Note", "Status", "PictureUrl", "Phone", "Department", "StatusMessage"
        ]);
      } else {
        // ตรวจสอบและเพิ่ม Header เพิ่มเติมอัตโนมัติหากยังไม่มี
        const lastCol = Math.max(orderSheet.getLastColumn(), 12);
        const headerRange = orderSheet.getRange(1, 1, 1, lastCol);
        const headers = headerRange.getValues()[0];
        if (!headers[8]) orderSheet.getRange(1, 9).setValue("PictureUrl");
        if (!headers[9]) orderSheet.getRange(1, 10).setValue("Phone");
        if (!headers[10]) orderSheet.getRange(1, 11).setValue("Department");
        if (!headers[11]) orderSheet.getRange(1, 12).setValue("StatusMessage");
      }

      // เตรียมชุดข้อมูลสำหรับเขียนลงชีทแบบ Batch (เร็วกว่า appendRow ทีละแถวมาก)
      const rowsToAdd = validItems.map(item => {
        const itemNote = (item.note && String(item.note).trim() !== "-" && String(item.note).trim() !== "") 
          ? String(item.note).trim() 
          : generalNote;
        return [
          timestamp,
          round,
          userId,
          displayName,
          String(item.menuName).trim(),
          parseInt(item.quantity, 10) || 1,
          itemNote,
          status,
          pictureUrl,
          phone,
          department,
          statusMessage
        ];
      });

      const nextRow = orderSheet.getLastRow() + 1;
      orderSheet.getRange(nextRow, 1, rowsToAdd.length, 12).setValues(rowsToAdd);

      return jsonResponse({
        status: "success",
        message: `บันทึกออเดอร์ ${validItems.length} รายการเรียบร้อยแล้ว`,
        data: {
          timestamp,
          round,
          displayName,
          itemCount: validItems.length,
          items: validItems.map(it => ({ menuName: it.menuName, quantity: it.quantity })),
          phone,
          department
        }
      });
    }

    // =============================================================
    // ส่วนคำสั่งของระบบหลังบ้าน (Admin Actions) - ต้องตรวจสอบสิทธิ์ Admin ก่อน
    // =============================================================
    const adminCheck = checkAdminUser(ss, payload.adminUserId, payload.adminDisplayName);
    if (!adminCheck.isAdmin) {
      return jsonResponse({
        status: "error",
        code: 403,
        message: "ปฏิเสธการเข้าถึง: คุณไม่มีสิทธิ์จัดการระบบหลังบ้าน"
      });
    }

    const userRole = adminCheck.role || "Admin"; // "SuperAdmin" | "Admin" | "Cook"

    // Guard: สิทธิ์ Cook ไม่อนุญาตให้ตั้งค่ารอบ
    if ((action === "updateRound" || action === "updateSchedule") && userRole === "Cook") {
      throw new Error("สิทธิ์ Cook ไม่สามารถกำหนดรอบและหน้าสั่งอาหารได้");
    }

    // Guard: สิทธิ์ Cook ไม่อนุญาตให้เพิ่ม ลบ หรือแก้ไขเมนู (อนุญาตเฉพาะสลับเปิด/ปิดขาย toggleMenuStatus)
    if ((action === "saveMenu" || action === "deleteMenu") && userRole === "Cook") {
      throw new Error("สิทธิ์ Cook ไม่สามารถเพิ่มหรือลบเมนูได้ (อนุญาตเฉพาะสลับเปิด/ปิดขาย)");
    }

    // Guard: สิทธิ์จัดการผู้ดูแลระบบ (เพิ่ม/ลบ/แก้ไข/สลับ Active-Inactive) อนุญาตเฉพาะ SuperAdmin เท่านั้น
    if (action === "addAdmin" || action === "deleteAdmin" || action === "toggleAdminStatus" || action === "editAdmin") {
      if (userRole !== "SuperAdmin") {
        throw new Error("เฉพาะ SuperAdmin เท่านั้นที่สามารถจัดการผู้ดูแลระบบได้");
      }
    }

    // 1. อัปเดตรอบสั่งอาหาร (updateRound)
    if (action === "updateRound") {
      const newRound = String(payload.newRound || "").trim();
      if (!newRound) throw new Error("กรุณาระบุชื่อรอบ");

      let settingsSheet = ss.getSheetByName("Settings");
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet("Settings");
        settingsSheet.appendRow(["CurrentRound", newRound]);
      } else {
        const sData = settingsSheet.getDataRange().getValues();
        let found = false;
        for (let i = 0; i < sData.length; i++) {
          const key = String(sData[i][0]).trim().toLowerCase();
          if (key === "currentround" || key === "รอบปัจจุบัน") {
            settingsSheet.getRange(i + 1, 2).setValue(newRound);
            found = true;
            break;
          }
        }
        if (!found) {
          settingsSheet.appendRow(["CurrentRound", newRound]);
        }
      }

      return jsonResponse({ status: "success", message: "อัปเดตรอบสั่งอาหารสำเร็จ", newRound });
    }

    // 2. สลับสถานะเมนู เปิดขาย / ปิดขาย (toggleMenuStatus)
    if (action === "toggleMenuStatus") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const newStatus = payload.newStatus === "Available" ? "Available" : "Sold Out";
      const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
      
      if (rowIndex > 1 && menuSheet) {
        menuSheet.getRange(rowIndex, 3).setValue(newStatus);
        return jsonResponse({ status: "success", message: `ปรับสถานะเป็น ${newStatus} แล้ว` });
      }
      throw new Error("ไม่พบรายการเมนูที่ระบุ");
    }

    // 3. บันทึก/เพิ่มเมนูอาหาร (saveMenu)
    if (action === "saveMenu") {
      const name = String(payload.name || "").trim();
      const price = Number(payload.price) || 0;
      const status = payload.status || "Available";
      let imageUrl = String(payload.imageUrl || "").trim();
      const imageBase64 = payload.imageBase64 || "";
      const rowIndex = parseInt(payload.rowIndex, 10);

      if (!name) throw new Error("กรุณาระบุชื่อเมนู");

      // หากมีข้อมูลรูปภาพ Base64 ส่งมา ให้อัปโหลดไปยัง Google Drive
      if (imageBase64) {
        try {
          imageUrl = uploadImageToDrive(imageBase64, name);
        } catch (uploadErr) {
          console.error("Drive upload failed: " + uploadErr.message);
          throw new Error("อัปโหลดรูปภาพไปยัง Google Drive ไม่สำเร็จ: " + uploadErr.message);
        }
      }

      let menuSheet = ss.getSheetByName("Menu");
      if (!menuSheet) {
        menuSheet = ss.insertSheet("Menu");
        menuSheet.appendRow(["MenuName", "Price", "Status", "ImageUrl"]);
      } else {
        // ตรวจสอบและเพิ่มหัวตารางคอลัมน์ที่ 4 เป็น ImageUrl หากยังไม่มี
        if (menuSheet.getLastColumn() < 4) {
          menuSheet.getRange(1, 4).setValue("ImageUrl");
        }
      }

      if (rowIndex && rowIndex > 1) {
        // แก้ไขเมนูเดิม
        menuSheet.getRange(rowIndex, 1).setValue(name);
        menuSheet.getRange(rowIndex, 2).setValue(price);
        menuSheet.getRange(rowIndex, 3).setValue(status);
        if (payload.imageUrl !== undefined || imageBase64) {
          menuSheet.getRange(rowIndex, 4).setValue(imageUrl);
        }
        return jsonResponse({ status: "success", message: "แก้ไขเมนูอาหารสำเร็จ", imageUrl: imageUrl });
      } else {
        // เพิ่มเมนูใหม่
        menuSheet.appendRow([name, price, status, imageUrl]);
        return jsonResponse({ status: "success", message: "เพิ่มเมนูใหม่เรียบร้อยแล้ว", imageUrl: imageUrl });
      }
    }

    // 4. ลบเมนูอาหาร (deleteMenu)
    if (action === "deleteMenu") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
      if (rowIndex > 1 && menuSheet) {
        menuSheet.deleteRow(rowIndex);
        return jsonResponse({ status: "success", message: "ลบเมนูเรียบร้อยแล้ว" });
      }
      throw new Error("ไม่พบแถวเมนูที่ต้องการลบ");
    }

    // 5. ปรับสถานะออเดอร์ (updateOrderStatus)
    if (action === "updateOrderStatus") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const newStatus = payload.newStatus || "Completed";
      const orderSheet = ss.getSheetByName("Orders");
      if (rowIndex > 1 && orderSheet) {
        orderSheet.getRange(rowIndex, 8).setValue(newStatus);
        return jsonResponse({ status: "success", message: `อัปเดตสถานะเป็น ${newStatus} แล้ว` });
      }
      throw new Error("ไม่พบแถวออเดอร์ที่ต้องการอัปเดต");
    }

    // 6. เพิ่ม Admin ใหม่ (addAdmin)
    if (action === "addAdmin") {
      const newAdminUserId = String(payload.newAdminUserId || "").trim();
      const newAdminName = String(payload.newAdminName || "").trim();
      const role = payload.role || "Admin";

      if (!newAdminUserId) throw new Error("กรุณาระบุ LINE User ID");

      let adminSheet = ss.getSheetByName("Admins");
      if (!adminSheet) {
        adminSheet = ss.insertSheet("Admins");
        adminSheet.appendRow(["UserId", "DisplayName", "Role", "CreatedAt"]);
      }

      const now = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      adminSheet.appendRow([newAdminUserId, newAdminName, role, now]);

      return jsonResponse({ status: "success", message: "เพิ่มสิทธิ์ผู้ดูแลเรียบร้อยแล้ว" });
    }

    // 7. ลบ Admin (deleteAdmin)
    if (action === "deleteAdmin") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const adminSheet = ss.getSheetByName("Admins");
      if (rowIndex > 1 && adminSheet) {
        adminSheet.deleteRow(rowIndex);
        return jsonResponse({ status: "success", message: "ลบสิทธิ์ผู้ดูแลเรียบร้อยแล้ว" });
      }
      throw new Error("ไม่พบข้อมูลผู้ดูแล");
    }

    // 8. กำหนดหน้าสั่งอาหารแบบครบวงจร (updateSchedule: รอบ + วันที่ + เลือกเมนู)
    if (action === "updateSchedule") {
      const roundTitle = String(payload.roundTitle || "").trim();
      const menuStatusMap = payload.menuStatusMap || {};

      if (!roundTitle) throw new Error("กรุณาระบุชื่อรอบสั่งอาหาร");

      // 1. ปรับ CurrentRound ในชีท Settings
      let settingsSheet = ss.getSheetByName("Settings");
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet("Settings");
        settingsSheet.appendRow(["CurrentRound", roundTitle]);
      } else {
        const sData = settingsSheet.getDataRange().getValues();
        let found = false;
        for (let i = 0; i < sData.length; i++) {
          const key = String(sData[i][0]).trim().toLowerCase();
          if (key === "currentround" || key === "รอบปัจจุบัน") {
            settingsSheet.getRange(i + 1, 2).setValue(roundTitle);
            found = true;
            break;
          }
        }
        if (!found) {
          settingsSheet.appendRow(["CurrentRound", roundTitle]);
        }
      }

      // 2. ปรับสถานะเปิด/ปิดขาย (Available / Sold Out) แบบ Batch Write ครั้งเดียว (เสร็จใน 0.1 วินาที)
      const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
      if (menuSheet && menuStatusMap && Object.keys(menuStatusMap).length > 0) {
        const lastRow = menuSheet.getLastRow();
        if (lastRow >= 2) {
          const numRows = lastRow - 1;
          const statusRange = menuSheet.getRange(2, 3, numRows, 1);
          const statusValues = statusRange.getValues();
          for (let i = 0; i < numRows; i++) {
            const r = i + 2;
            if (menuStatusMap.hasOwnProperty(r)) {
              statusValues[i][0] = menuStatusMap[r] ? "Available" : "Sold Out";
            }
          }
          statusRange.setValues(statusValues);
        }
      }

      // ล้าง Cache เพื่อให้ลูกค้าเห็นรอบและเมนูใหม่ทันที
      try {
        CacheService.getScriptCache().remove("appData_fast_cache");
        CacheService.getScriptCache().remove("admin_dash_cache");
      } catch (cErr) {}

      return jsonResponse({
        status: "success",
        message: "บันทึกการตั้งค่าหน้าสั่งอาหารและเมนูประจำวันสำเร็จ",
        roundTitle: roundTitle
      });
    }

    // 9. สลับสถานะผู้ดูแล Active / Inactive (toggleAdminStatus)
    if (action === "toggleAdminStatus") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const newStatus = payload.newStatus === "Inactive" ? "Inactive" : "Active";
      const adminSheet = ss.getSheetByName("Admins");

      if (rowIndex > 1 && adminSheet) {
        if (adminSheet.getLastColumn() < 5) {
          adminSheet.getRange(1, 5).setValue("Status");
        }
        adminSheet.getRange(rowIndex, 5).setValue(newStatus);
        return jsonResponse({
          status: "success",
          message: `ปรับสถานะผู้ดูแลเป็น ${newStatus} แล้ว`
        });
      }
      throw new Error("ไม่พบข้อมูลผู้ดูแลระบบ");
    }

    // 10. แก้ไขข้อมูลผู้ดูแลระบบ (editAdmin)
    if (action === "editAdmin") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const newUserId = String(payload.userId || "").trim();
      const newName = String(payload.name || "").trim();
      const role = payload.role || "Admin";
      const adminSheet = ss.getSheetByName("Admins");

      if (rowIndex > 1 && adminSheet) {
        if (newUserId) adminSheet.getRange(rowIndex, 1).setValue(newUserId);
        if (newName) adminSheet.getRange(rowIndex, 2).setValue(newName);
        if (role) adminSheet.getRange(rowIndex, 3).setValue(role);
        return jsonResponse({
          status: "success",
          message: "แก้ไขข้อมูลผู้ดูแลเรียบร้อยแล้ว"
        });
      }
      throw new Error("ไม่พบข้อมูลผู้ดูแลระบบ");
    }

    throw new Error("ไม่พบคำสั่ง (Unknown Action)");

  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error.message || "เกิดข้อผิดพลาดในการประมวลผลคำสั่ง"
    });
  }
}

/**
 * ส่งคืน JSON Output พร้อมตั้งค่า Header
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันอัปโหลดรูปภาพ Base64 ไปยังโฟลเดอร์ใน Google Drive และสร้าง Direct Link
 */
function uploadImageToDrive(base64Data, menuName) {
  if (!base64Data) return "";
  try {
    let contentType = "image/jpeg";
    let base64Clean = base64Data;
    if (base64Data.indexOf(",") > -1) {
      const parts = base64Data.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) contentType = mimeMatch[1];
      base64Clean = parts[1];
    }

    const decoded = Utilities.base64Decode(base64Clean);
    const sanitizedName = (menuName || "menu").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "_");
    const fileName = sanitizedName + "_" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss") + ".jpg";
    const blob = Utilities.newBlob(decoded, contentType, fileName);

    let folder;
    if (typeof DRIVE_FOLDER_ID !== "undefined" && DRIVE_FOLDER_ID) {
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      } catch (fErr) {
        console.warn("Cannot open folder by ID (" + DRIVE_FOLDER_ID + "): " + fErr.message);
      }
    }

    if (!folder) {
      const folderName = "FoodMenu_Images";
      const folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    }

    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn("Folder permission error: " + e.message);
    }

    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn("File permission error: " + e.message);
    }

    // สร้าง Direct Image URL ที่สามารถโหลดในแท็ก <img> ได้ทันที
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (err) {
    console.error("uploadImageToDrive error: " + err.message);
    throw new Error(err.message || "ไม่สามารถอัปโหลดไฟล์ภาพได้");
  }
}

/**
 * ฟังก์ชันสำหรับกดรันใน Apps Script Editor เพื่อขอสิทธิ์ Google Drive แบบเต็ม (Write / Create File)
 */
function authorizeDrivePermissions() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  // เรียกคำสั่งสร้างและลบไฟล์ เพื่อบังคับให้ Google ขอสิทธิ์ Write (https://www.googleapis.com/auth/drive)
  const testFile = folder.createFile("temp_permission_check.txt", "Permission Granted");
  testFile.setTrashed(true);
  console.log("✅ ได้รับสิทธิ์ Google Drive แบบ Write/Create File ครบถ้วนเรียบร้อยแล้ว!");
}
