/**
 * ====================================================================
 * ระบบสั่งอาหารผ่าน LINE LIFF & LINE Official Account (LINE OA)
 * Google Apps Script Backend (API & Webhook Engine)
 * รองรับ:
 *  1. ฝั่งลูกค้า: สั่งอาหารผ่าน LIFF พร้อมส่ง Push Flex Receipt ใบเสร็จเข้าแชท
 *  2. ฝั่งร้านค้า: จัดการเมนู, รอบสั่ง, ยอดครัว, บรอดแคสต์แจ้งเปิดรอบผ่าน LINE OA
 *  3. LINE Webhook Engine: ตอบกลับอัตโนมัติ (เมนู, เช็คสถานะ, เลขบัญชี, สลิป)
 * ====================================================================
 */

// 1. กำหนด ID ของ Google Spreadsheet
const SPREADSHEET_ID = "1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo";

// 2. กำหนด ID ของ Google Drive Folder สำหรับเก็บรูปภาพเมนูอาหาร
const DRIVE_FOLDER_ID = "1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR";

// 3. กำหนดค่าเริ่มต้น LINE Messaging API (สามารถตั้งค่าในชีท 'Settings' หรือหน้า Admin ได้เช่นกัน)
const DEFAULT_LINE_CHANNEL_ACCESS_TOKEN = "";
const LIFF_ORDER_URL = "https://liff.line.me/2011625055-XnlJJcQp";

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
 * ดึงการตั้งค่าทั้งหมดจากชีท 'Settings' ในรูปแบบ Map
 */
function getSettingsMap(ss) {
  const map = {};
  const settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) return map;
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    const key = String(data[i][0] || "").trim().toLowerCase();
    if (key) {
      map[key] = String(data[i][1] || "").trim();
    }
  }
  return map;
}

/**
 * ดึงค่าตั้งค่ารายตัว
 */
function getSettingValue(ss, keyName, defaultValue) {
  const map = getSettingsMap(ss);
  const val = map[String(keyName).toLowerCase()];
  return (val !== undefined && val !== "") ? val : (defaultValue || "");
}

/**
 * บันทึกค่าลงในชีท 'Settings'
 */
function setSettingValue(ss, keyName, value) {
  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    settingsSheet.appendRow(["Key", "Value"]);
  }
  const data = settingsSheet.getDataRange().getValues();
  const searchKey = String(keyName).trim().toLowerCase();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === searchKey) {
      settingsSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  settingsSheet.appendRow([keyName, value]);
}

/**
 * ดึง LINE Channel Access Token
 */
function getLineChannelAccessToken(ss) {
  if (typeof DEFAULT_LINE_CHANNEL_ACCESS_TOKEN !== "undefined" && DEFAULT_LINE_CHANNEL_ACCESS_TOKEN) {
    return DEFAULT_LINE_CHANNEL_ACCESS_TOKEN;
  }
  try {
    const propToken = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
    if (propToken) return propToken;
  } catch (e) {}

  if (ss) {
    const tokenFromSheet = getSettingValue(ss, "LineChannelAccessToken");
    if (tokenFromSheet) return tokenFromSheet;
  }
  return "";
}

/**
 * ดึงชื่อรอบปัจจุบัน
 */
function getCurrentRound(ss) {
  const settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet) {
    const sData = settingsSheet.getDataRange().getValues();
    for (let i = 0; i < sData.length; i++) {
      const key = String(sData[i][0]).trim().toLowerCase();
      if (key === "currentround" || key === "รอบปัจจุบัน") {
        const val = String(sData[i][1]).trim();
        if (val) return val;
      }
    }
  }
  return "รอบปกติ";
}

/**
 * ดึงรายการเมนูที่เปิดขาย (Available)
 */
function getAvailableMenus(ss) {
  const available = [];
  const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
  if (!menuSheet) return available;
  const menuData = menuSheet.getDataRange().getValues();
  for (let i = 1; i < menuData.length; i++) {
    const row = menuData[i];
    const name = String(row[0] || "").trim();
    const price = Number(row[1]) || 0;
    const status = String(row[2] || "").trim().toLowerCase();
    const imageUrl = String(row[3] || "").trim();
    if (name && (status === "available" || status === "พร้อมขาย" || status === "")) {
      available.push({ id: i, name: name, price: price, imageUrl: imageUrl });
    }
  }
  return available;
}

/**
 * ค้นหาออเดอร์ล่าสุดของ User ID
 */
function findLatestOrderByUserId(ss, userId) {
  if (!userId) return null;
  const orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) return null;
  const data = orderSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const rowUserId = String(data[i][2] || "").trim();
    if (rowUserId === String(userId).trim()) {
      return {
        rowIndex: i + 1,
        timestamp: data[i][0],
        round: data[i][1],
        userId: rowUserId,
        displayName: data[i][3],
        menuName: data[i][4],
        quantity: data[i][5],
        note: data[i][6],
        status: data[i][7] || "Pending"
      };
    }
  }
  return null;
}

/**
 * ฟังก์ชันตรวจสอบสิทธิ์ Admin จากชีท 'Admins'
 */
function checkAdminUser(ss, userId, displayName) {
  if (!userId) return { isAdmin: false };

  let adminSheet = ss.getSheetByName("Admins");
  if (!adminSheet) {
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

// ====================================================================
// LINE MESSAGING API ENGINE & FLEX MESSAGE BUILDERS
// ====================================================================

/**
 * ยิงคำขอไปยัง LINE Messaging API
 */
function callLineApi(endpoint, payload, accessToken) {
  if (!accessToken) {
    return { success: false, error: "Missing Channel Access Token" };
  }
  try {
    const url = "https://api.line.me/v2/bot/" + endpoint;
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    const content = response.getContentText();
    if (code >= 200 && code < 300) {
      return { success: true, code: code, data: content ? JSON.parse(content) : {} };
    } else {
      console.error("LINE API error (" + code + "): " + content);
      return { success: false, code: code, error: content };
    }
  } catch (err) {
    console.error("callLineApi exception: " + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ส่ง Push Message ไปยังผู้ใช้คนเดียว (1-on-1)
 */
function sendLinePush(accessToken, toUserId, messages) {
  return callLineApi("message/push", {
    to: toUserId,
    messages: messages
  }, accessToken);
}

/**
 * ส่ง Broadcast Message ไปยังผู้ติดตามทุกคนของ LINE OA
 */
function sendLineBroadcast(accessToken, messages) {
  return callLineApi("message/broadcast", {
    messages: messages
  }, accessToken);
}

/**
 * ตอบกลับข้อความผ่าน Reply Token (ฟรี ไม่เสียโควต้าข้อความ)
 */
function replyLineMessage(accessToken, replyToken, messages) {
  return callLineApi("message/reply", {
    replyToken: replyToken,
    messages: messages
  }, accessToken);
}

/**
 * สร้าง Flex Message ใบเสร็จรับเงิน (Order Receipt)
 */
function buildOrderReceiptFlex(orderData, ss) {
  const liffUrl = (ss ? getSettingValue(ss, "LiffUrl") : "") || LIFF_ORDER_URL;
  const items = orderData.items || [];
  const orderId = orderData.orderId || ("ORD-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyMMdd-HHmmss"));
  const round = orderData.round || "-";
  const customerName = orderData.displayName || "คุณลูกค้า";
  const note = (orderData.note && orderData.note !== "-") ? orderData.note : "";
  const phone = (orderData.phone && orderData.phone !== "-") ? orderData.phone : "";
  const department = (orderData.department && orderData.department !== "-") ? orderData.department : "";

  let totalCalculated = 0;
  const itemBoxes = items.map(function(item) {
    const q = parseInt(item.quantity, 10) || 1;
    const p = Number(item.price) || 0;
    const itemTotal = p * q;
    totalCalculated += itemTotal;

    const rowContents = [
      {
        "type": "text",
        "text": (item.menuName || "อาหาร") + " x " + q,
        "size": "sm",
        "color": "#334155",
        "flex": 4,
        "wrap": true
      }
    ];

    if (p > 0) {
      rowContents.push({
        "type": "text",
        "text": "฿" + itemTotal.toLocaleString(),
        "size": "sm",
        "color": "#0F172A",
        "align": "end",
        "weight": "bold",
        "flex": 2
      });
    }

    return {
      "type": "box",
      "layout": "horizontal",
      "contents": rowContents,
      "margin": "sm"
    };
  });

  const finalTotal = orderData.total || totalCalculated;

  const bodyContents = [
    {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "รหัสคำสั่งซื้อ:", "size": "xs", "color": "#94A3B8" },
        { "type": "text", "text": "#" + orderId, "size": "xs", "color": "#64748B", "align": "end", "weight": "bold" }
      ]
    },
    {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "รอบการสั่ง:", "size": "xs", "color": "#94A3B8" },
        { "type": "text", "text": round, "size": "xs", "color": "#059669", "align": "end", "weight": "bold" }
      ]
    },
    {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "ผู้สั่ง:", "size": "xs", "color": "#94A3B8" },
        { "type": "text", "text": customerName + (phone ? " (" + phone + ")" : ""), "size": "xs", "color": "#334155", "align": "end" }
      ]
    }
  ];

  if (department) {
    bodyContents.push({
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "แผนก/จุดรับ:", "size": "xs", "color": "#94A3B8" },
        { "type": "text", "text": department, "size": "xs", "color": "#334155", "align": "end" }
      ]
    });
  }

  bodyContents.push({ "type": "separator", "margin": "md", "color": "#E2E8F0" });
  bodyContents.push({
    "type": "text",
    "text": "รายการอาหารที่สั่ง",
    "size": "xs",
    "weight": "bold",
    "color": "#64748B",
    "margin": "md"
  });

  bodyContents.push.apply(bodyContents, itemBoxes);

  if (note) {
    bodyContents.push({
      "type": "box",
      "layout": "horizontal",
      "margin": "sm",
      "contents": [
        { "type": "text", "text": "หมายเหตุ:", "size": "xxs", "color": "#EF4444", "flex": 2 },
        { "type": "text", "text": note, "size": "xxs", "color": "#475569", "flex": 6, "wrap": true }
      ]
    });
  }

  bodyContents.push({ "type": "separator", "margin": "md", "color": "#E2E8F0" });

  if (finalTotal > 0) {
    bodyContents.push({
      "type": "box",
      "layout": "horizontal",
      "margin": "md",
      "contents": [
        { "type": "text", "text": "ยอดรวมสุทธิ", "size": "md", "weight": "bold", "color": "#0F172A" },
        { "type": "text", "text": "฿" + Number(finalTotal).toLocaleString(), "size": "lg", "weight": "bold", "color": "#059669", "align": "end" }
      ]
    });
  }

  bodyContents.push({
    "type": "box",
    "layout": "horizontal",
    "margin": "md",
    "backgroundColor": "#FEF3C7",
    "cornerRadius": "8px",
    "paddingAll": "8px",
    "justifyContent": "center",
    "alignItems": "center",
    "contents": [
      {
        "type": "text",
        "text": "🟡 ได้รับคำสั่งซื้อแล้ว รอแม่ครัวจัดเตรียม",
        "size": "xs",
        "color": "#B45309",
        "weight": "bold",
        "align": "center"
      }
    ]
  });

  return {
    "type": "flex",
    "altText": "🧾 ได้รับคำสั่งซื้อแล้ว: " + (items[0] ? items[0].menuName : "รายการอาหาร"),
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#06C755",
        "paddingAll": "16px",
        "contents": [
          {
            "type": "text",
            "text": "ใบเสร็จคำสั่งซื้ออาหาร",
            "weight": "bold",
            "color": "#FFFFFF",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "ระบบบันทึกออเดอร์เรียบร้อยแล้ว ✅",
            "color": "#DCFCE7",
            "size": "xs",
            "margin": "xs"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": bodyContents
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "spacing": "xs",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "uri",
              "label": "🍽️ สั่งอาหารเพิ่ม / เปิดเมนู",
              "uri": liffUrl
            },
            "style": "primary",
            "color": "#06C755",
            "height": "sm"
          },
          {
            "type": "text",
            "text": "พิมพ์ 'เช็คสถานะ' ในแชทนี้เพื่อติดตามออเดอร์ได้เลยค่ะ",
            "size": "xxs",
            "color": "#94A3B8",
            "align": "center",
            "margin": "sm"
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message ประกาศเปิดรอบสั่งอาหาร (Round Announcement)
 */
function buildRoundAnnouncementFlex(roundTitle, notice, menus, liffUrl) {
  const url = liffUrl || LIFF_ORDER_URL;
  const menuList = menus || [];

  const bodyContents = [
    {
      "type": "text",
      "text": "🍱 เปิดรับออเดอร์แล้ว!",
      "weight": "bold",
      "size": "xl",
      "color": "#0F172A"
    },
    {
      "type": "box",
      "layout": "baseline",
      "margin": "sm",
      "contents": [
        { "type": "text", "text": "รอบ: ", "size": "sm", "color": "#64748B", "flex": 1 },
        { "type": "text", "text": roundTitle || "รอบปกติ", "size": "md", "weight": "bold", "color": "#059669", "flex": 4 }
      ]
    }
  ];

  if (notice && notice.trim() !== "") {
    bodyContents.push({
      "type": "box",
      "layout": "horizontal",
      "margin": "sm",
      "backgroundColor": "#FEF2F2",
      "paddingAll": "8px",
      "cornerRadius": "8px",
      "contents": [
        {
          "type": "text",
          "text": "⏰ " + notice.trim(),
          "size": "xs",
          "color": "#DC2626",
          "weight": "bold",
          "wrap": true
        }
      ]
    });
  }

  bodyContents.push({ "type": "separator", "margin": "md", "color": "#E2E8F0" });
  bodyContents.push({
    "type": "text",
    "text": "📋 เมนูแนะนำประจำรอบนี้",
    "size": "xs",
    "weight": "bold",
    "color": "#64748B",
    "margin": "md"
  });

  const previewMenus = menuList.slice(0, 5);
  if (previewMenus.length === 0) {
    bodyContents.push({
      "type": "text",
      "text": "กดเปิดดูเมนูอาหารทั้งหมดได้ที่ปุ่มด้านล่าง",
      "size": "xs",
      "color": "#94A3B8",
      "margin": "sm"
    });
  } else {
    previewMenus.forEach(function(m) {
      bodyContents.push({
        "type": "box",
        "layout": "horizontal",
        "margin": "sm",
        "contents": [
          { "type": "text", "text": "• " + m.name, "size": "sm", "color": "#334155", "flex": 4, "wrap": true },
          { "type": "text", "text": "฿" + m.price, "size": "sm", "color": "#059669", "align": "end", "weight": "bold", "flex": 2 }
        ]
      });
    });
  }

  return {
    "type": "flex",
    "altText": "📢 เปิดรับออเดอร์: " + roundTitle + " กดสั่งอาหารได้ที่นี่!",
    "contents": {
      "type": "bubble",
      "size": "mega",
      "hero": {
        "type": "image",
        "url": (previewMenus[0] && previewMenus[0].imageUrl) ? previewMenus[0].imageUrl : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        "size": "full",
        "aspectRatio": "20:10",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": bodyContents
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "uri",
              "label": "🛒 กดสั่งอาหารที่นี่ (เปิด LINE)",
              "uri": url
            },
            "style": "primary",
            "color": "#06C755",
            "height": "md"
          },
          {
            "type": "text",
            "text": "กดเปิดหน้าสั่งอาหาร สะดวก รวดเร็ว",
            "size": "xxs",
            "color": "#94A3B8",
            "align": "center"
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message แจ้งเตือนสถานะอาหาร (Status Transition)
 */
function buildOrderStatusFlex(round, menuName, quantity, newStatus, customerName) {
  let headerColor = "#059669";
  let title = "🔔 อาหารของคุณพร้อมแล้ว!";
  let subtitle = "อาหารปรุงเสร็จเรียบร้อยแล้วค่ะ";
  let statusBadge = "✅ พร้อมรับประทาน / เสร็จสิ้น";
  let statusBadgeBg = "#DCFCE7";
  let statusBadgeColor = "#166534";
  let desc = "รายการ " + menuName + " (จำนวน " + quantity + " กล่อง) ปรุงเสร็จแล้ว สามารถมารับได้ที่จุดรับอาหารได้เลยนะคะ 😋";

  if (newStatus === "Cooking" || newStatus === "กำลังทำ") {
    headerColor = "#D97706";
    title = "🍳 แม่ครัวกำลังปรุงอาหาร...";
    subtitle = "กำลังจัดเตรียมอาหารของคุณอย่างพิถีพิถัน";
    statusBadge = "🔥 กำลังปรุงอาหาร";
    statusBadgeBg = "#FEF3C7";
    statusBadgeColor = "#B45309";
    desc = "แม่ครัวเริ่มลงมือปรุง " + menuName + " ให้แล้วนะคะ รอสักครู่ จะแจ้งเตือนทันทีเมื่อเสร็จค่ะ";
  } else if (newStatus === "Cancelled" || newStatus === "ยกเลิก") {
    headerColor = "#DC2626";
    title = "❌ แจ้งเตือน: ออเดอร์ถูกยกเลิก";
    subtitle = "ขออภัยในความไม่สะดวก";
    statusBadge = "🚫 ยกเลิกรายการ";
    statusBadgeBg = "#FEE2E2";
    statusBadgeColor = "#991B1B";
    desc = "รายการ " + menuName + " ของคุณถูกยกเลิก หากมีข้อสงสัยโปรดสอบถามผ่านแชทนี้ค่ะ";
  }

  return {
    "type": "flex",
    "altText": title + ": " + menuName,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": headerColor,
        "paddingAll": "16px",
        "contents": [
          { "type": "text", "text": title, "weight": "bold", "color": "#FFFFFF", "size": "md" },
          { "type": "text", "text": subtitle, "color": "#F1F5F9", "size": "xs", "margin": "xs" }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "md",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "backgroundColor": statusBadgeBg,
            "cornerRadius": "8px",
            "paddingAll": "8px",
            "justifyContent": "center",
            "contents": [
              { "type": "text", "text": statusBadge, "size": "xs", "color": statusBadgeColor, "weight": "bold" }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": [
              { "type": "text", "text": "รอบ: " + round, "size": "xs", "color": "#64748B" },
              { "type": "text", "text": "เมนู: " + menuName + " x " + quantity, "size": "sm", "weight": "bold", "color": "#1E293B" }
            ]
          },
          { "type": "separator", "color": "#E2E8F0" },
          { "type": "text", "text": desc, "size": "xs", "color": "#475569", "wrap": true }
        ]
      }
    }
  };
}

// ====================================================================
// LINE WEBHOOK HANDLERS (AUTO-REPLY ENGINE)
// ====================================================================

/**
 * ประมวลผล Events จาก LINE Webhook
 */
function handleLineWebhookEvents(ss, payload) {
  const events = payload.events || [];
  if (events.length === 0) {
    // กรณี LINE Developers กดปุ่ม Verify Webhook
    return jsonResponse({ status: "ok", message: "LINE Webhook Verified Successfully" });
  }

  const token = getLineChannelAccessToken(ss);
  if (!token) {
    console.warn("Webhook received but LINE_CHANNEL_ACCESS_TOKEN is not configured.");
    return jsonResponse({ status: "ok", message: "Token not configured" });
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    try {
      if (event.type === "message") {
        handleIncomingLineMessage(ss, token, event);
      } else if (event.type === "follow") {
        handleLineFollowEvent(ss, token, event);
      }
    } catch (evErr) {
      console.error("Error processing LINE event: " + evErr.message);
    }
  }

  return jsonResponse({ status: "ok" });
}

/**
 * จัดการข้อความที่ลูกค้าพิมพ์ส่งมาใน LINE OA
 */
function handleIncomingLineMessage(ss, token, event) {
  const replyToken = event.replyToken;
  const userId = event.source ? event.source.userId : "";
  const msgType = event.message ? event.message.type : "";

  if (msgType === "text") {
    const rawText = String(event.message.text || "").trim();
    const lower = rawText.toLowerCase();

    // 1. ตรวจสอบคีย์เวิร์ดสั่งอาหาร / ดูเมนู / รอบอาหาร
    if (lower.includes("สั่ง") || lower.includes("เมนู") || lower.includes("รอบ") || lower.includes("หิว") || lower.includes("กิน") || lower.includes("order") || lower.includes("menu")) {
      const round = getCurrentRound(ss);
      const menus = getAvailableMenus(ss);
      const notice = getSettingValue(ss, "ShopNotice", "กดสั่งอาหารล่วงหน้าได้เลยค่ะ");
      const liffUrl = getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
      const flexCard = buildRoundAnnouncementFlex(round, notice, menus, liffUrl);
      replyLineMessage(token, replyToken, [flexCard]);
      return;
    }

    // 2. ตรวจสอบคีย์เวิร์ดเช็คสถานะออเดอร์
    if (lower.includes("สถานะ") || lower.includes("ออเดอร์") || lower.includes("เช็ค") || lower.includes("ได้ยัง") || lower.includes("status")) {
      const latestOrder = findLatestOrderByUserId(ss, userId);
      if (latestOrder) {
        const flexStatus = buildOrderStatusFlex(
          latestOrder.round,
          latestOrder.menuName,
          latestOrder.quantity,
          latestOrder.status,
          latestOrder.displayName
        );
        replyLineMessage(token, replyToken, [flexStatus]);
      } else {
        const liffUrl = getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
        replyLineMessage(token, replyToken, [
          {
            "type": "text",
            "text": "ยังไม่พบรายการสั่งซื้อล่าสุดของคุณในรอบนี้ค่ะ 😊\nคุณสามารถกดดูเมนูและสั่งอาหารได้ที่นี่เลยนะคะ 👇",
            "quickReply": {
              "items": [
                {
                  "type": "action",
                  "action": { "type": "uri", "label": "🍱 สั่งอาหารรอบนี้", "uri": liffUrl }
                }
              ]
            }
          }
        ]);
      }
      return;
    }

    // 3. ตรวจสอบคีย์เวิร์ดเลขบัญชี / โอนเงิน / พร้อมเพย์
    if (lower.includes("เลขบัญชี") || lower.includes("โอน") || lower.includes("พร้อมเพย์") || lower.includes("promptpay") || lower.includes("จ่าย") || lower.includes("ชำระ")) {
      const ppNum = getSettingValue(ss, "PromptPayNumber", "08X-XXX-XXXX");
      const ppName = getSettingValue(ss, "PromptPayName", "ร้านอาหาร");
      replyLineMessage(token, replyToken, [
        {
          "type": "text",
          "text": "💳 ข้อมูลการชำระเงิน / โอนเงิน\n\n🔹 พร้อมเพย์ (PromptPay): " + ppNum + "\n🔹 ชื่อบัญชี: " + ppName + "\n\nเมื่อโอนเงินเรียบร้อยแล้ว สามารถส่งรูปสลิปเข้ามาในแชทนี้ได้เลยนะคะ ขอบคุณค่ะ 🙏✨"
        }
      ]);
      return;
    }

    // 4. ตรวจสอบคีย์เวิร์ดติดต่อร้าน / แอดมิน
    if (lower.includes("ติดต่อ") || lower.includes("แอดมิน") || lower.includes("เบอร์") || lower.includes("โทร") || lower.includes("contact")) {
      const phone = getSettingValue(ss, "ShopPhone", "08X-XXX-XXXX");
      replyLineMessage(token, replyToken, [
        {
          "type": "text",
          "text": "📞 ติดต่อร้านอาหาร / แอดมิน\n\nเบอร์โทรศัพท์: " + phone + "\nหากมีข้อสอบถามเพิ่มเติม สามารถพิมพ์ข้อความทิ้งไว้ได้เลยค่ะ แอดมินจะรีบเข้ามาตอบนะคะ 😊"
        }
      ]);
      return;
    }

    // 5. ข้อความเริ่มต้น / ข้อความทั่วไป -> ส่ง Quick Reply อำนวยความสะดวก
    const liffUrl = getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
    replyLineMessage(token, replyToken, [
      {
        "type": "text",
        "text": "สวัสดีค่ะ ยินดีต้อนรับสู่ระบบสั่งอาหาร 🍱\nเลือกรายการที่ต้องการได้จากปุ่มลัดด้านล่างนี้ได้เลยค่ะ 👇",
        "quickReply": {
          "items": [
            { "type": "action", "action": { "type": "uri", "label": "🛒 สั่งอาหารรอบนี้", "uri": liffUrl } },
            { "type": "action", "action": { "type": "message", "label": "🔍 เช็คสถานะออเดอร์", "text": "เช็คสถานะ" } },
            { "type": "action", "action": { "type": "message", "label": "💳 เลขบัญชีโอนเงิน", "text": "เลขบัญชี" } },
            { "type": "action", "action": { "type": "message", "label": "📞 ติดต่อร้านค้า", "text": "ติดต่อร้าน" } }
          ]
        }
      }
    ]);
  } else if (msgType === "image") {
    // ลูกค้าส่งรูปภาพ (สลิปโอนเงิน)
    replyLineMessage(token, replyToken, [
      {
        "type": "text",
        "text": "📸 ได้รับรูปภาพ/สลิปโอนเงินของคุณเรียบร้อยแล้วค่ะ! ทางร้านจะตรวจสอบยอดและเร่งจัดเตรียมอาหารให้นะคะ ขอบคุณค่ะ 🙏✨"
      }
    ]);
  }
}

/**
 * จัดการเมื่อมีลูกค้ากดติดตาม LINE OA ใหม่
 */
function handleLineFollowEvent(ss, token, event) {
  const replyToken = event.replyToken;
  const round = getCurrentRound(ss);
  const menus = getAvailableMenus(ss);
  const liffUrl = getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
  const flexCard = buildRoundAnnouncementFlex(round, "เปิดรับออเดอร์พร้อมบริการค่ะ", menus, liffUrl);
  replyLineMessage(token, replyToken, [
    {
      "type": "text",
      "text": "ยินดีต้อนรับเข้าสู่ช่องทางสั่งอาหารออนไลน์อย่างเป็นทางการค่ะ! 🎉\nคุณสามารถกดดูเมนูและสั่งอาหารได้สะดวกผ่านลิงก์ด้านล่างนี้ได้เลยนะคะ 👇"
    },
    flexCard
  ]);
}

// ====================================================================
// HTTP REQUEST ROUTERS (doGet & doPost)
// ====================================================================

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
      const currentRound = getCurrentRound(ss);

      // 2. เมนูทั้งหมด
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
        const maxOrders = 100;
        const startRow = Math.max(1, oData.length - maxOrders);
        for (let i = oData.length - 1; i >= 1; i--) {
          const row = oData[i];
          const oRound = String(row[1] || "").trim();
          const oMenu = String(row[4] || "").trim();
          const oQty = parseInt(row[5], 10) || 1;
          const oStatus = String(row[7] || "Pending").trim();

          if (oRound === currentRound && oStatus !== "Cancelled") {
            kitchenSummary[oMenu] = (kitchenSummary[oMenu] || 0) + oQty;
          }

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

      // 5. การตั้งค่าระบบ (Settings & LINE Connection)
      const settingsMap = getSettingsMap(ss);
      const activeLineToken = getLineChannelAccessToken(ss);
      const isLineConnected = (activeLineToken && activeLineToken.length > 20);

      const dashResponse = {
        status: "success",
        data: {
          currentRound: currentRound,
          menus: allMenus,
          orders: orders,
          kitchenSummary: kitchenSummary,
          admins: admins,
          adminRole: adminCheck.role,
          settings: {
            isLineConnected: isLineConnected,
            lineChannelAccessToken: activeLineToken ? ("••••••••" + activeLineToken.slice(-6)) : "",
            liffUrl: settingsMap.liffurl || LIFF_ORDER_URL,
            promptPayNumber: settingsMap.promptpaynumber || "",
            promptPayName: settingsMap.promptpayname || "",
            shopPhone: settingsMap.shopphone || "",
            shopNotice: settingsMap.shopnotice || ""
          }
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
    // Action: getRoundFlexPayload (ดึง Flex Card สำหรับแชร์หรือแสดงตัวอย่าง)
    // -------------------------------------------------------------
    if (action === "getRoundFlexPayload") {
      const roundTitle = e.parameter.roundTitle || getCurrentRound(ss);
      const notice = e.parameter.notice || getSettingValue(ss, "ShopNotice", "");
      const liffUrl = e.parameter.liffUrl || getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
      const menus = getAvailableMenus(ss);
      const flexMsg = buildRoundAnnouncementFlex(roundTitle, notice, menus, liffUrl);
      return jsonResponse({
        status: "success",
        flexMessage: flexMsg
      });
    }

    // -------------------------------------------------------------
    // Action: getAppData (ค่าเริ่มต้นสำหรับหน้าลูกค้าสั่งอาหาร)
    // -------------------------------------------------------------
    const scriptCache = CacheService.getScriptCache();
    const cachedAppData = scriptCache.get("appData_fast_cache");
    if (cachedAppData) {
      return ContentService.createTextOutput(cachedAppData)
        .setMimeType(ContentService.MimeType.JSON);
    }

    const currentRound = getCurrentRound(ss);
    const availableMenus = getAvailableMenus(ss);

    const appDataResult = {
      status: "success",
      round: currentRound,
      menus: availableMenus,
      timestamp: new Date().toISOString()
    };

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
 * POST Request: จัดการ Webhook Events, การบันทึกออเดอร์ลูกค้า, และคำสั่งระบบหลังบ้าน
 */
function doPost(e) {
  try {
    const ss = getSpreadsheet();
    if (!ss) throw new Error("ไม่สามารถเปิด Google Spreadsheet ได้");

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // -------------------------------------------------------------
    // 0. ตรวจสอบว่าเป็น LINE Webhook Event หรือไม่
    // -------------------------------------------------------------
    if (payload.events && Array.isArray(payload.events)) {
      return handleLineWebhookEvents(ss, payload);
    }

    const action = payload.action || "order";

    // เคลียร์ Cache เพื่อให้ข้อมูลสดใหม่ทันที
    try {
      CacheService.getScriptCache().remove("appData_fast_cache");
      CacheService.getScriptCache().remove("admin_dash_cache");
    } catch (cacheErr) {}

    // -------------------------------------------------------------
    // Action: order (ลูกค้าสั่งอาหาร - บันทึกชีท + Push Flex Receipt)
    // -------------------------------------------------------------
    if (action === "order") {
      const round = payload.round || getCurrentRound(ss);
      const userId = payload.userId || "-";
      const displayName = payload.displayName || "ผู้ใช้ไม่ระบุชื่อ";
      const pictureUrl = payload.pictureUrl || "";
      const phone = payload.phone || "-";
      const department = payload.department || "-";
      const statusMessage = payload.statusMessage || "-";
      const generalNote = payload.note || "-";
      const timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      const status = "Pending";

      let orderItems = [];
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        orderItems = payload.items;
      } else if (payload.menuName) {
        orderItems = [{
          menuName: payload.menuName,
          quantity: parseInt(payload.quantity, 10) || 1,
          price: Number(payload.price) || 0,
          note: generalNote
        }];
      }

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
        const lastCol = Math.max(orderSheet.getLastColumn(), 12);
        const headerRange = orderSheet.getRange(1, 1, 1, lastCol);
        const headers = headerRange.getValues()[0];
        if (!headers[8]) orderSheet.getRange(1, 9).setValue("PictureUrl");
        if (!headers[9]) orderSheet.getRange(1, 10).setValue("Phone");
        if (!headers[10]) orderSheet.getRange(1, 11).setValue("Department");
        if (!headers[11]) orderSheet.getRange(1, 12).setValue("StatusMessage");
      }

      const rowsToAdd = validItems.map(item => {
        let finalMenuName = String(item.menuName || '').trim();
        const extras = [];
        if (item.isExtra && !finalMenuName.includes('พิเศษ')) extras.push('พิเศษ');
        if (item.hasEgg && !finalMenuName.includes('ไข่ดาว')) extras.push('+ไข่ดาว');
        if (extras.length > 0) {
          finalMenuName += ` (${extras.join(', ')})`;
        }

        const itemNote = (item.note && String(item.note).trim() !== "-" && String(item.note).trim() !== "") 
          ? String(item.note).trim() 
          : generalNote;
        return [
          timestamp,
          round,
          userId,
          displayName,
          finalMenuName,
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

      // สร้าง Flex Receipt สำหรับส่งเข้า LINE OA ของลูกค้า
      const flexReceipt = buildOrderReceiptFlex({
        orderId: "ORD-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyMMdd-HHmmss"),
        round: round,
        displayName: displayName,
        timestamp: timestamp,
        items: validItems,
        total: payload.total || 0,
        note: generalNote,
        phone: phone,
        department: department
      }, ss);

      // ส่ง Push Message ตรงเข้าห้องแชท LINE OA ของลูกค้ารายบุคคล (ถ้ามี Token)
      let linePushed = false;
      try {
        const token = getLineChannelAccessToken(ss);
        if (token && userId && String(userId).startsWith("U")) {
          const pushRes = sendLinePush(token, userId, [flexReceipt]);
          linePushed = pushRes.success;
        }
      } catch (pErr) {
        console.warn("LINE push receipt failed: " + pErr.message);
      }

      return jsonResponse({
        status: "success",
        message: `บันทึกออเดอร์ ${validItems.length} รายการเรียบร้อยแล้ว`,
        linePushed: linePushed,
        flexReceipt: flexReceipt,
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
    // ส่วนคำสั่งของระบบหลังบ้าน (Admin Actions)
    // =============================================================
    const adminCheck = checkAdminUser(ss, payload.adminUserId, payload.adminDisplayName);
    if (!adminCheck.isAdmin) {
      return jsonResponse({
        status: "error",
        code: 403,
        message: "ปฏิเสธการเข้าถึง: คุณไม่มีสิทธิ์จัดการระบบหลังบ้าน"
      });
    }

    const userRole = adminCheck.role || "Admin";

    // Guard: สิทธิ์ Cook
    if ((action === "updateRound" || action === "updateSchedule" || action === "broadcastRound" || action === "saveSettings") && userRole === "Cook") {
      throw new Error("สิทธิ์ Cook ไม่สามารถแก้ไขรอบหรือตั้งค่าระบบได้");
    }

    if ((action === "saveMenu" || action === "deleteMenu") && userRole === "Cook") {
      throw new Error("สิทธิ์ Cook ไม่สามารถเพิ่มหรือลบเมนูได้");
    }

    // Guard: SuperAdmin เท่านั้นที่จัดการ Admin ได้
    if (action === "addAdmin" || action === "deleteAdmin" || action === "toggleAdminStatus" || action === "editAdmin") {
      if (userRole !== "SuperAdmin") {
        throw new Error("เฉพาะ SuperAdmin เท่านั้นที่สามารถจัดการผู้ดูแลระบบได้");
      }
    }

    // 1. อัปเดตรอบสั่งอาหาร (updateRound)
    if (action === "updateRound") {
      const newRound = String(payload.newRound || "").trim();
      if (!newRound) throw new Error("กรุณาระบุชื่อรอบ");
      setSettingValue(ss, "CurrentRound", newRound);
      return jsonResponse({ status: "success", message: "อัปเดตรอบสั่งอาหารสำเร็จ", newRound });
    }

    // 2. บรอดแคสต์เปิดรอบผ่าน LINE Messaging API (broadcastRound)
    if (action === "broadcastRound") {
      const token = getLineChannelAccessToken(ss);
      if (!token) throw new Error("ยังไม่ได้ตั้งค่า LINE Channel Access Token ในระบบ");

      const roundTitle = payload.roundTitle || getCurrentRound(ss);
      const notice = payload.notice || getSettingValue(ss, "ShopNotice", "");
      const liffUrl = payload.liffUrl || getSettingValue(ss, "LiffUrl", LIFF_ORDER_URL);
      const menus = getAvailableMenus(ss);

      const flexCard = buildRoundAnnouncementFlex(roundTitle, notice, menus, liffUrl);
      const res = sendLineBroadcast(token, [flexCard]);

      if (!res.success) {
        throw new Error("ส่ง Broadcast ไม่สำเร็จ: " + (res.error || ""));
      }
      return jsonResponse({ status: "success", message: "ส่งบรอดแคสต์แจ้งเปิดรอบไปยัง LINE OA สำเร็จเรียบร้อยแล้ว!" });
    }

    // 3. สลับสถานะเมนู เปิดขาย / ปิดขาย (toggleMenuStatus)
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

    // 4. บันทึก/เพิ่มเมนูอาหาร (saveMenu)
    if (action === "saveMenu") {
      const name = String(payload.name || "").trim();
      const price = Number(payload.price) || 0;
      const status = payload.status || "Available";
      let imageUrl = String(payload.imageUrl || "").trim();
      const imageBase64 = payload.imageBase64 || "";
      const rowIndex = parseInt(payload.rowIndex, 10);

      if (!name) throw new Error("กรุณาระบุชื่อเมนู");

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
        if (menuSheet.getLastColumn() < 4) {
          menuSheet.getRange(1, 4).setValue("ImageUrl");
        }
      }

      if (rowIndex && rowIndex > 1) {
        menuSheet.getRange(rowIndex, 1).setValue(name);
        menuSheet.getRange(rowIndex, 2).setValue(price);
        menuSheet.getRange(rowIndex, 3).setValue(status);
        if (payload.imageUrl !== undefined || imageBase64) {
          menuSheet.getRange(rowIndex, 4).setValue(imageUrl);
        }
        return jsonResponse({ status: "success", message: "แก้ไขเมนูอาหารสำเร็จ", imageUrl: imageUrl });
      } else {
        menuSheet.appendRow([name, price, status, imageUrl]);
        return jsonResponse({ status: "success", message: "เพิ่มเมนูใหม่เรียบร้อยแล้ว", imageUrl: imageUrl });
      }
    }

    // 5. ลบเมนูอาหาร (deleteMenu)
    if (action === "deleteMenu") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const menuSheet = ss.getSheetByName("Menu") || ss.getSheets()[0];
      if (rowIndex > 1 && menuSheet) {
        menuSheet.deleteRow(rowIndex);
        return jsonResponse({ status: "success", message: "ลบเมนูเรียบร้อยแล้ว" });
      }
      throw new Error("ไม่พบแถวเมนูที่ต้องการลบ");
    }

    // 6. ปรับสถานะออเดอร์ (updateOrderStatus) พร้อมส่งแจ้งเตือนใน LINE
    if (action === "updateOrderStatus") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const newStatus = payload.newStatus || "Completed";
      const notifyCustomer = payload.notifyCustomer === true;
      const orderSheet = ss.getSheetByName("Orders");

      if (rowIndex > 1 && orderSheet) {
        orderSheet.getRange(rowIndex, 8).setValue(newStatus);

        let notified = false;
        if (notifyCustomer) {
          try {
            const rowData = orderSheet.getRange(rowIndex, 1, 1, 12).getValues()[0];
            const oRound = rowData[1];
            const oUserId = rowData[2];
            const oName = rowData[3];
            const oMenu = rowData[4];
            const oQty = rowData[5];

            const token = getLineChannelAccessToken(ss);
            if (token && oUserId && String(oUserId).startsWith("U")) {
              const statusFlex = buildOrderStatusFlex(oRound, oMenu, oQty, newStatus, oName);
              const pushRes = sendLinePush(token, oUserId, [statusFlex]);
              notified = pushRes.success;
            }
          } catch (nErr) {
            console.warn("Notify customer failed: " + nErr.message);
          }
        }

        return jsonResponse({
          status: "success",
          message: `อัปเดตสถานะเป็น ${newStatus} แล้ว` + (notified ? " (ส่งแจ้งเตือนใน LINE เรียบร้อย)" : ""),
          notified: notified
        });
      }
      throw new Error("ไม่พบแถวออเดอร์ที่ต้องการอัปเดต");
    }

    // 7. เพิ่ม Admin ใหม่ (addAdmin)
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

    // 8. ลบ Admin (deleteAdmin)
    if (action === "deleteAdmin") {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const adminSheet = ss.getSheetByName("Admins");
      if (rowIndex > 1 && adminSheet) {
        adminSheet.deleteRow(rowIndex);
        return jsonResponse({ status: "success", message: "ลบสิทธิ์ผู้ดูแลเรียบร้อยแล้ว" });
      }
      throw new Error("ไม่พบข้อมูลผู้ดูแล");
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

    // 11. อัปโหลดรูปภาพไปยัง Google Drive (uploadImage)
    if (action === "uploadImage") {
      const imageBase64 = payload.imageBase64 || "";
      const fileName = payload.fileName || payload.menuName || "menu_image";
      if (!imageBase64) {
        throw new Error("กรุณาส่งข้อมูลรูปภาพ (imageBase64)");
      }
      const directImageUrl = uploadImageToDrive(imageBase64, fileName);
      return jsonResponse({
        status: "success",
        message: "อัปโหลดรูปภาพสำเร็จ",
        imageUrl: directImageUrl
      });
    }

    // 12. บันทึกการตั้งค่าระบบ (saveSettings: LINE Token, PromptPay, เบอร์โทร, Notice)
    if (action === "saveSettings") {
      const settings = payload.settings || {};
      for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
          setSettingValue(ss, key, String(settings[key] || "").trim());
        }
      }
      return jsonResponse({ status: "success", message: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว" });
    }

    // 13. ทดสอบส่งข้อความแจ้งเตือน (testLineMessage)
    if (action === "testLineMessage") {
      const token = getLineChannelAccessToken(ss);
      if (!token) throw new Error("ยังไม่ได้ระบุ LINE Channel Access Token ในระบบ");
      const targetUserId = payload.targetUserId || payload.adminUserId;
      if (!targetUserId) throw new Error("ไม่พบ LINE User ID สำหรับทดสอบ");

      const testFlex = {
        "type": "flex",
        "altText": "✅ ทดสอบการเชื่อมต่อ LINE Messaging API สำเร็จ",
        "contents": {
          "type": "bubble",
          "size": "kilo",
          "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#059669",
            "paddingAll": "14px",
            "contents": [
              { "type": "text", "text": "✅ ทดสอบการเชื่อมต่อ LINE OA", "weight": "bold", "color": "#FFFFFF", "size": "md" }
            ]
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
              { "type": "text", "text": "เชื่อมต่อ LINE Messaging API สำเร็จแล้ว!", "weight": "bold", "size": "sm", "color": "#1E293B" },
              { "type": "text", "text": "ระบบพร้อมส่งการ์ดเปิดรอบ, ใบเสร็จรับเงิน, และการแจ้งเตือนสถานะอาหารเข้าสู่ห้องแชท LINE เรียบร้อยแล้วค่ะ 🎉", "size": "xs", "color": "#64748B", "wrap": true }
            ]
          }
        }
      };

      const res = sendLinePush(token, targetUserId, [testFlex]);
      if (!res.success) {
        throw new Error("ทดสอบส่งข้อความไม่สำเร็จ: " + (res.error || ""));
      }
      return jsonResponse({ status: "success", message: "ส่งข้อความทดสอบเข้า LINE ของคุณเรียบร้อยแล้ว!" });
    }

    throw new Error("ไม่พบคำสั่ง (Unknown Action: " + action + ")");

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

    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (err) {
    console.error("uploadImageToDrive error: " + err.message);
    throw new Error(err.message || "ไม่สามารถอัปโหลดไฟล์ภาพได้");
  }
}

/**
 * ฟังก์ชันสำหรับกดรันใน Apps Script Editor เพื่อขอสิทธิ์ Google Drive แบบเต็ม
 */
function authorizeDrivePermissions() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const testFile = folder.createFile("temp_permission_check.txt", "Permission Granted");
  testFile.setTrashed(true);
  console.log("✅ ได้รับสิทธิ์ Google Drive แบบ Write/Create File ครบถ้วนเรียบร้อยแล้ว!");
}
