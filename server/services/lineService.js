/**
 * LINE Messaging API Service & Flex Message Builders (Node.js Express)
 */

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const LIFF_ORDER_URL = process.env.LIFF_ORDER_URL || "https://liff.line.me/2011625055-XnlJJcQp";

/**
 * เรียกใช้งาน LINE Messaging API Endpoint
 */
async function callLineApi(endpoint, payload, customToken) {
  const token = customToken || LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: "Missing LINE_CHANNEL_ACCESS_TOKEN" };
  }

  try {
    const response = await fetch(`https://api.line.me/v2/bot/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.text();
    if (response.ok) {
      return { success: true, status: response.status, data: data ? JSON.parse(data) : {} };
    } else {
      console.error(`LINE API error (${response.status}):`, data);
      return { success: false, status: response.status, error: data };
    }
  } catch (err) {
    console.error("callLineApi network error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ส่ง Push Message ไปยังผู้ใช้เดี่ยว (1-on-1)
 */
async function sendPushMessage(userId, messages, token) {
  return callLineApi("message/push", {
    to: userId,
    messages: Array.isArray(messages) ? messages : [messages]
  }, token);
}

/**
 * ส่ง Broadcast Message หาผู้ติดตามทุกคนใน LINE OA
 */
async function sendBroadcast(messages, token) {
  return callLineApi("message/broadcast", {
    messages: Array.isArray(messages) ? messages : [messages]
  }, token);
}

/**
 * ตอบกลับข้อความผ่าน Reply Token (ฟรี ไม่เสียโควต้า)
 */
async function sendReply(replyToken, messages, token) {
  return callLineApi("message/reply", {
    replyToken,
    messages: Array.isArray(messages) ? messages : [messages]
  }, token);
}

/**
 * สร้าง Flex Message ใบเสร็จรับเงิน (Order Receipt)
 */
function buildOrderReceiptFlex(orderData, liffUrl = LIFF_ORDER_URL) {
  const items = orderData.items || [];
  const orderId = orderData.orderId || `ORD-${Date.now().toString().slice(-6)}`;
  const round = orderData.round || "-";
  const customerName = orderData.displayName || "คุณลูกค้า";
  const note = (orderData.note && orderData.note !== "-") ? orderData.note : "";
  const phone = (orderData.phone && orderData.phone !== "-") ? orderData.phone : "";
  const department = (orderData.department && orderData.department !== "-") ? orderData.department : "";

  let totalCalculated = 0;
  const itemBoxes = items.map(item => {
    const q = parseInt(item.quantity, 10) || 1;
    const p = Number(item.price) || 0;
    const itemTotal = p * q;
    totalCalculated += itemTotal;

    const rowContents = [
      {
        type: "text",
        text: `${item.menuName || "อาหาร"} x ${q}`,
        size: "sm",
        color: "#334155",
        flex: 4,
        wrap: true
      }
    ];

    if (p > 0) {
      rowContents.push({
        type: "text",
        text: `฿${itemTotal.toLocaleString()}`,
        size: "sm",
        color: "#0F172A",
        align: "end",
        weight: "bold",
        flex: 2
      });
    }

    return {
      type: "box",
      layout: "horizontal",
      contents: rowContents,
      margin: "sm"
    };
  });

  const finalTotal = orderData.total || totalCalculated;

  const bodyContents = [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: "รหัสคำสั่งซื้อ:", size: "xs", color: "#94A3B8" },
        { type: "text", text: `#${orderId}`, size: "xs", color: "#64748B", align: "end", weight: "bold" }
      ]
    },
    {
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: "รอบการสั่ง:", size: "xs", color: "#94A3B8" },
        { type: "text", text: round, size: "xs", color: "#059669", align: "end", weight: "bold" }
      ]
    },
    {
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: "ผู้สั่ง:", size: "xs", color: "#94A3B8" },
        { type: "text", text: customerName + (phone ? ` (${phone})` : ""), size: "xs", color: "#334155", align: "end" }
      ]
    }
  ];

  if (department) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: "แผนก/จุดรับ:", size: "xs", color: "#94A3B8" },
        { type: "text", text: department, size: "xs", color: "#334155", align: "end" }
      ]
    });
  }

  bodyContents.push({ type: "separator", margin: "md", color: "#E2E8F0" });
  bodyContents.push({
    type: "text",
    text: "รายการอาหารที่สั่ง",
    size: "xs",
    weight: "bold",
    color: "#64748B",
    margin: "md"
  });

  bodyContents.push(...itemBoxes);

  if (note) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        { type: "text", text: "หมายเหตุ:", size: "xxs", color: "#EF4444", flex: 2 },
        { type: "text", text: note, size: "xxs", color: "#475569", flex: 6, wrap: true }
      ]
    });
  }

  bodyContents.push({ type: "separator", margin: "md", color: "#E2E8F0" });

  if (finalTotal > 0) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      margin: "md",
      contents: [
        { type: "text", text: "ยอดรวมสุทธิ", size: "md", weight: "bold", color: "#0F172A" },
        { type: "text", text: `฿${Number(finalTotal).toLocaleString()}`, size: "lg", weight: "bold", color: "#059669", align: "end" }
      ]
    });
  }

  bodyContents.push({
    type: "box",
    layout: "horizontal",
    margin: "md",
    backgroundColor: "#FEF3C7",
    cornerRadius: "8px",
    paddingAll: "8px",
    justifyContent: "center",
    alignItems: "center",
    contents: [
      {
        type: "text",
        text: "🟡 ได้รับคำสั่งซื้อแล้ว รอแม่ครัวจัดเตรียม",
        size: "xs",
        color: "#B45309",
        weight: "bold",
        align: "center"
      }
    ]
  });

  return {
    type: "flex",
    altText: `🧾 ได้รับคำสั่งซื้อแล้ว: ${items[0] ? items[0].menuName : "รายการอาหาร"}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#06C755",
        paddingAll: "16px",
        contents: [
          { type: "text", text: "ใบเสร็จคำสั่งซื้ออาหาร", weight: "bold", color: "#FFFFFF", size: "lg" },
          { type: "text", text: "ระบบบันทึกออเดอร์เรียบร้อยแล้ว ✅", color: "#DCFCE7", size: "xs", margin: "xs" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "🍽️ สั่งอาหารเพิ่ม / เปิดเมนู",
              uri: liffUrl
            },
            style: "primary",
            color: "#06C755",
            height: "sm"
          },
          {
            type: "text",
            text: "พิมพ์ 'เช็คสถานะ' ในแชทนี้เพื่อติดตามออเดอร์ได้เลยค่ะ",
            size: "xxs",
            color: "#94A3B8",
            align: "center",
            margin: "sm"
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message ประกาศเปิดรอบสั่งอาหาร (Round Announcement)
 */
function buildRoundAnnouncementFlex(roundTitle, notice, menus, liffUrl = LIFF_ORDER_URL) {
  const menuList = menus || [];

  const bodyContents = [
    {
      type: "text",
      text: "🍱 เปิดรับออเดอร์แล้ว!",
      weight: "bold",
      size: "xl",
      color: "#0F172A"
    },
    {
      type: "box",
      layout: "baseline",
      margin: "sm",
      contents: [
        { type: "text", text: "รอบ: ", size: "sm", color: "#64748B", flex: 1 },
        { type: "text", text: roundTitle || "รอบปกติ", size: "md", weight: "bold", color: "#059669", flex: 4 }
      ]
    }
  ];

  if (notice && notice.trim() !== "") {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      margin: "sm",
      backgroundColor: "#FEF2F2",
      paddingAll: "8px",
      cornerRadius: "8px",
      contents: [
        {
          type: "text",
          text: "⏰ " + notice.trim(),
          size: "xs",
          color: "#DC2626",
          weight: "bold",
          wrap: true
        }
      ]
    });
  }

  bodyContents.push({ type: "separator", margin: "md", color: "#E2E8F0" });
  bodyContents.push({
    type: "text",
    text: "📋 เมนูแนะนำประจำรอบนี้",
    size: "xs",
    weight: "bold",
    color: "#64748B",
    margin: "md"
  });

  const previewMenus = menuList.slice(0, 5);
  if (previewMenus.length === 0) {
    bodyContents.push({
      type: "text",
      text: "กดเปิดดูเมนูอาหารทั้งหมดได้ที่ปุ่มด้านล่าง",
      size: "xs",
      color: "#94A3B8",
      margin: "sm"
    });
  } else {
    previewMenus.forEach(m => {
      bodyContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "• " + m.name, size: "sm", color: "#334155", flex: 4, wrap: true },
          { type: "text", text: `฿${m.price}`, size: "sm", color: "#059669", align: "end", weight: "bold", flex: 2 }
        ]
      });
    });
  }

  return {
    type: "flex",
    altText: `📢 เปิดรับออเดอร์: ${roundTitle} กดสั่งอาหารได้ที่นี่!`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
        type: "image",
        url: (previewMenus[0] && previewMenus[0].imageUrl) ? previewMenus[0].imageUrl : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        size: "full",
        aspectRatio: "20:10",
        aspectMode: "cover"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "🛒 กดสั่งอาหารที่นี่ (เปิด LINE)",
              uri: liffUrl
            },
            style: "primary",
            color: "#06C755",
            height: "md"
          },
          {
            type: "text",
            text: "กดเปิดหน้าสั่งอาหาร สะดวก รวดเร็ว",
            size: "xxs",
            color: "#94A3B8",
            align: "center"
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message แจ้งเตือนสถานะอาหาร
 */
function buildOrderStatusFlex(round, menuName, quantity, newStatus, customerName) {
  let headerColor = "#059669";
  let title = "🔔 อาหารของคุณพร้อมแล้ว!";
  let subtitle = "อาหารปรุงเสร็จเรียบร้อยแล้วค่ะ";
  let statusBadge = "✅ พร้อมรับประทาน / เสร็จสิ้น";
  let statusBadgeBg = "#DCFCE7";
  let statusBadgeColor = "#166534";
  let desc = `รายการ ${menuName} (จำนวน ${quantity} กล่อง) ปรุงเสร็จแล้ว สามารถมารับได้ที่จุดรับอาหารได้เลยนะคะ 😋`;

  if (newStatus === "Cooking" || newStatus === "กำลังทำ") {
    headerColor = "#D97706";
    title = "🍳 แม่ครัวกำลังปรุงอาหาร...";
    subtitle = "กำลังจัดเตรียมอาหารของคุณอย่างพิถีพิถัน";
    statusBadge = "🔥 กำลังปรุงอาหาร";
    statusBadgeBg = "#FEF3C7";
    statusBadgeColor = "#B45309";
    desc = `แม่ครัวเริ่มลงมือปรุง ${menuName} ให้แล้วนะคะ รอสักครู่ จะแจ้งเตือนทันทีเมื่อเสร็จค่ะ`;
  } else if (newStatus === "Cancelled" || newStatus === "ยกเลิก") {
    headerColor = "#DC2626";
    title = "❌ แจ้งเตือน: ออเดอร์ถูกยกเลิก";
    subtitle = "ขออภัยในความไม่สะดวก";
    statusBadge = "🚫 ยกเลิกรายการ";
    statusBadgeBg = "#FEE2E2";
    statusBadgeColor = "#991B1B";
    desc = `รายการ ${menuName} ของคุณถูกยกเลิก หากมีข้อสงสัยโปรดสอบถามผ่านแชทนี้ค่ะ`;
  }

  return {
    type: "flex",
    altText: `${title}: ${menuName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: headerColor,
        paddingAll: "16px",
        contents: [
          { type: "text", text: title, weight: "bold", color: "#FFFFFF", size: "md" },
          { type: "text", text: subtitle, color: "#F1F5F9", size: "xs", margin: "xs" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: statusBadgeBg,
            cornerRadius: "8px",
            paddingAll: "8px",
            justifyContent: "center",
            contents: [
              { type: "text", text: statusBadge, size: "xs", color: statusBadgeColor, weight: "bold" }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              { type: "text", text: `รอบ: ${round}`, size: "xs", color: "#64748B" },
              { type: "text", text: `เมนู: ${menuName} x ${quantity}`, size: "sm", weight: "bold", color: "#1E293B" }
            ]
          },
          { type: "separator", color: "#E2E8F0" },
          { type: "text", text: desc, size: "xs", color: "#475569", wrap: true }
        ]
      }
    }
  };
}

module.exports = {
  callLineApi,
  sendPushMessage,
  sendBroadcast,
  sendReply,
  buildOrderReceiptFlex,
  buildRoundAnnouncementFlex,
  buildOrderStatusFlex
};
