# คู่มือการติดตั้งและใช้งานระบบสั่งอาหารผ่าน LINE LIFF เชื่อมต่อ Google Sheets

ระบบสั่งอาหารผ่าน LINE LIFF ออกแบบมาสำหรับร้านค้าหรือชุมชนที่ต้องการเปิดรับออเดอร์ผ่านแอปพลิเคชัน LINE โดยดึงข้อมูลเมนูและรอบการสั่งจาก Google Sheets แบบเรียลไทม์ และบันทึกออเดอร์กลับเข้า Google Sheets ทันทีที่ผู้ใช้กดยืนยัน พร้อมปิดหน้าต่าง LIFF ให้อัตโนมัติ

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์รองรับทั้งรูปแบบ **Full-stack Node.js + React (ใหม่)** และแบบไฟล์ Standalone:
- **`server/` (Back-end: Node.js Express)**: API Server เชื่อมต่อ Google Sheets และ Google Drive
  - `server.js`: Express server จุดเริ่มต้นระบบ
  - `routes/`: แยกเส้นทาง API (`menuRoutes`, `orderRoutes`, `roundRoutes`, `adminRoutes`, `uploadRoutes`)
  - `controllers/`: ตัวควบคุม Business Logic แต่ละโมดูล
  - `services/`: ติดต่อกับ Google Sheets (`sheetService.js`) และ Google Drive (`driveService.js`)
  - `middlewares/`: ตรวจสอบสิทธิ์ผู้ดูแล (`authMiddleware.js`) และจัดการ Error (`errorHandler.js`)
- **`client/` (Front-end: React.js + Bootstrap 5)**: หน้าเว็บ Responsive สวยงาม
  - `src/components/`: แยกคอมโพเนนต์ย่อยสำหรับหน้าสั่งอาหารและระบบหลังบ้าน
  - `src/pages/`: หน้ารวม `OrderPage.jsx` และ `AdminPage.jsx`
  - `src/context/`: จัดการสถานะผู้ใช้และสิทธิ์ Admin (`AuthContext.jsx`)
  - `src/services/`: ตัวเรียก API ไปยัง Express Server
  - `src/utils/`: ย่อขนาดรูปภาพด้วย Canvas (`imageCompressor.js`) และจัดรูปแบบข้อมูล
- **ไฟล์เดิมสำหรับการรันแบบ Serverless Direct**:
  - `index.html`: หน้าเว็บสั่งอาหาร Standalone
  - `admin.html`: หน้าจัดการหลังบ้าน Standalone
  - `Code.gs`: Google Apps Script Backend

---

## 💻 การรันโปรเจกต์แบบ React + Node.js (Local Development)

```bash
# 1. ติดตั้ง Dependencies ทั้งหมด
npm run install:all

# 2. รันทั้ง Backend (Express) และ Frontend (React) พร้อมกัน
npm run dev

# เซิร์ฟเวอร์ API: http://localhost:5000
# หน้าเว็บ React: http://localhost:3000
```

---

## 🚀 ขั้นตอนการติดตั้งและ Deploy ทั้งระบบ (3 ขั้นตอน)

### ขั้นตอนที่ 1: ตั้งค่า Google Sheets & Google Apps Script

1. เปิด Google Spreadsheet ของคุณ:
   👉 [คลิกเพื่อเปิดชีท](https://docs.google.com/spreadsheets/d/1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo/edit)
2. ตรวจสอบว่าในชีทมีแท็บหลัก 3 แท็บดังนี้:
   - **Menu**: มีคอลัมน์ `MenuName`, `Price`, `Status`, `ImageUrl` (คอลัมน์ที่ 4 สำหรับเก็บ URL รูปภาพอาหาร โดยระบบจะสร้างหัวตารางให้อัตโนมัติเมื่อมีการเพิ่มเมนู)
   - **Settings**: แถวที่ 1 คอลัมน์ A ใส่ `CurrentRound` คอลัมน์ B ใส่ชื่อรอบ เช่น `รอบเที่ยง 16 ก.ย.`
   - **Orders**: มีหัวตาราง `Timestamp`, `Round`, `UserId`, `DisplayName`, `MenuName`, `Quantity`, `Note`, `Status` (หากยังไม่มี ระบบจะสร้างให้อัตโนมัติ)
3. ไปที่เมนูด้านบนของ Google Sheet: **ส่วนขยาย (Extensions) > Apps Script**
4. ลบโค้ดเดิมในไฟล์ `Code.gs` ออกทั้งหมด แล้วคัดลอกโค้ดจากไฟล์ [`Code.gs`](./Code.gs) ในโปรเจกต์นี้ไปวางแทน
5. กดปุ่มบันทึก (รูปแผ่นดิสก์ 💾)
6. ทำการ **Deploy (ทำให้ใช้งานได้)**:
   - คลิกปุ่มสีน้ำเงิน **ทำให้ใช้งานได้ (Deploy) > การทำให้ใช้งานได้ใหม่ (New deployment)**
   - คลิกรูปฟันเฟือง ⚙️ เลือกประเภทเป็น **เว็บแอป (Web app)**
   - กำหนดค่า:
     - **คำอธิบาย (Description):** `Food Order API v1.0`
     - **เรียกใช้ในฐานะ (Execute as):** `ฉัน (Me - บัญชี Google ของคุณ)`
     - **ผู้มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(สำคัญมาก: ต้องเลือก Anyone เพื่อให้เว็บเรียก API ได้)*
   - คลิก **ทำให้ใช้งานได้ (Deploy)**
   - ให้สิทธิ์การเข้าถึง (Authorize access) ตามขั้นตอนของ Google
   - คัดลอก **URL เว็บแอป (Web App URL)** ที่ลงท้ายด้วย `/exec`
7. นำ URL ที่ได้มาใส่ในไฟล์ [`index.html`](./index.html) ตรงตัวแปร:
   ```javascript
   const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```

---

### ขั้นตอนที่ 2: นำหน้าเว็บขึ้น Vercel (Hosting Frontend)

คุณสามารถนำไฟล์ `index.html` ขึ้นโฮสต์บน **Vercel** ได้ฟรี โดยเลือกวิธีใดวิธีหนึ่ง:

#### วิธีที่ A: ผ่าน GitHub (แนะนำ สะดวกที่สุด)
1. Push โปรเจกต์นี้ขึ้น GitHub Repository ของคุณ
2. เข้าไปที่ [Vercel Dashboard](https://vercel.com/) แล้วกด **Add New... > Project**
3. เลือก Repository ที่เพิ่ง Push ขึ้นไป แล้วกด **Deploy**
4. เมื่อเสร็จสิ้น คุณจะได้โดเมน เช่น `https://your-food-order.vercel.app`

#### วิธีที่ B: ผ่าน Vercel CLI
เปิด Terminal ในโฟลเดอร์นี้ แล้วรันคำสั่ง:
```bash
npx vercel
```
ทำตามขั้นตอนบนหน้าจอเพื่อ Deploy ได้ทันที

---

### ขั้นตอนที่ 3: ตั้งค่าใน LINE Developers Console (LIFF)

1. เข้าสู่ระบบ [LINE Developers Console](https://developers.line.biz/)
2. เลือก Provider และ Channel (ประเภท LINE Login) ของคุณ
3. ไปที่แท็บ **LIFF**
4. หากสร้าง LIFF App ไว้แล้ว (เช่น LIFF ID: `2011625055-XnlJJcQp`):
   - คลิกเข้าไปแก้ไข แล้วอัปเดตช่อง **Endpoint URL** เป็น URL ของ Vercel ที่ได้จากขั้นตอนที่ 2 เช่น:
     ```text
     https://your-food-order.vercel.app
     ```
   - **Size (ขนาดหน้าจอ):** แนะนำเลือก `Full` เพื่อให้แสดงเต็มหน้าจอมือถือสวยงาม
   - **Scopes:** ติ๊กเลือก `profile` และ `openid`
   - **Bot link feature:** Normal หรือ Off
   - กด **Save**
5. ตรวจสอบว่าในไฟล์ [`index.html`](./index.html) ระบุค่า `LIFF_ID` ตรงกับใน LINE Developers Console:
   ```javascript
   const LIFF_ID = "2011625055-XnlJJcQp";
   ```

---

## 📱 การใช้งานและการแชร์ลิงก์
คัดลอกลิงก์ LIFF เช่น:
```text
https://liff.line.me/2011625055-XnlJJcQp
```
นำไปวางในปุ่ม Rich Menu, ส่งเข้าห้องแชท หรือส่งในกลุ่ม LINE ได้ทันที!

### สิ่งที่ระบบจะทำงาน:
1. เมื่อผู้ใช้คลิกลิงก์ หน้าจอจะเปิดขึ้นในแอป LINE พร้อมล็อกอินดึงรูปและชื่อให้อัตโนมัติ
2. ระบบจะโหลดชื่อรอบและเมนูอาหารที่เปิดขาย (`Available`) จาก Google Sheets มาแสดง
3. ผู้ใช้สามารถกดเพิ่ม/ลดจำนวน คำนวณราคารวมสด และกดชิปหมายเหตุด่วน (เช่น ไม่เผ็ด, พิเศษ) ได้สะดวก
4. เมื่อกด **"ยืนยันการสั่งอาหาร"** ระบบจะแสดงกล่องยืนยัน และส่งข้อมูลบันทึกลงชีท `Orders`
5. ขึ้นป๊อปอัปสำเร็จ และทำการปิดหน้าต่าง LIFF ให้อัตโนมัติใน 2.5 วินาที

---

## 👨‍🍳 ระบบหลังบ้านสำหรับผู้ดูแล (Admin Portal)

เข้าใช้งานผ่าน:
```text
https://your-food-order.vercel.app/admin.html
```
*(หรือกดปุ่ม **"⚙️ จัดการระบบ"** ที่มุมบนขวาของหน้าสั่งอาหาร หากบัญชีของคุณเป็นผู้ดูแล)*

### ระบบความปลอดภัยและการให้สิทธิ์ (Admin Whitelist)
- ระบบตรวจสอบ **LINE User ID** เทียบกับชีท **`Admins`** ใน Google Sheets
- **ผู้ดูแลคนแรก (First Admin)**: เมื่อชีท `Admins` ยังว่างอยู่ ผู้ดูแลคนแรกที่ล็อกอินเข้า `admin.html` จะได้รับสิทธิ์เป็น **SuperAdmin** โดยอัตโนมัติทันที
- **การเพิ่มผู้ดูแลคนอื่น**:
  - สามารถกดเพิ่มในแท็บ **"ผู้ดูแลระบบ"** ในหน้า `admin.html` ได้เลย
  - หรือให้ผู้นั้นเปิดหน้า `admin.html` ระบบจะขึ้นหน้าจอไม่อนุญาตพร้อมปุ่มให้คัดลอก LINE User ID ของเขามาให้คุณนำไปใส่ในชีท `Admins`

### ฟังก์ชันในหน้าหลังบ้าน
1. **จัดการเมนูประจำวัน**: สลับสวิตช์ เปิดขาย/ปิดขาย สำหรับแต่ละวัน, เพิ่มเมนูใหม่พร้อมอัปโหลดรูปภาพ (ถ่ายรูป/เลือกไฟล์/ใส่ URL/เลือกภาพสำเร็จรูป), แก้ไขราคาและรูปภาพ, ดูรูปขยาย, ลบเมนู
2. **กำหนดรอบสั่งอาหาร**: เปลี่ยนชื่อรอบ เช่น `รอบเที่ยง 17 ก.ย.` หรือกดปุ่มลัด `🚫 ปิดรับออเดอร์ชั่วคราว` พร้อมปุ่ม:
   - **📢 บรอดแคสต์ผ่าน LINE OA**: ยิงการ์ด Flex Message แจ้งเปิดรอบหาผู้ติดตามทุกคนใน LINE OA ทันที
   - **📤 แชร์ลงกลุ่ม LINE (ฟรี)**: ใช้ LIFF Share Target Picker ส่งการ์ดรอบเข้ากลุ่ม LINE ออฟฟิศ/เพื่อนได้ฟรี ไม่เสียโควต้าบรอดแคสต์
3. **ออเดอร์ & ยอดครัว**: สรุปจำนวนกล่องที่ต้องทำแต่ละเมนูให้แม่ครัวทันที พร้อมตารางออเดอร์และปุ่มปรับสถานะ (`🍳 กำลังทำ` / `✓ เสร็จสิ้น` / `✕ ยกเลิก`) พร้อมตัวเลือกส่ง Push Notification แจ้งลูกค้าใน LINE ทันที
4. **LINE OA & ตั้งค่าระบบ**: บันทึก Channel Access Token, ดู Webhook URL, ตั้งค่าเบอร์พร้อมเพย์ และปุ่มทดสอบส่งข้อความเข้า LINE
5. **จัดการผู้ดูแล**: ดูรายชื่อและเพิ่ม/ลบสิทธิ์ผู้ดูแลระบบ

---

## 🤖 การติดตั้งและตั้งค่า LINE Official Account (LINE OA & Messaging API)

เพื่อให้ระบบสามารถส่งใบเสร็จ, บรอดแคสต์รอบสั่งอาหาร, และตอบกลับลูกค้าอัตโนมัติ ให้ทำตามขั้นตอนดังนี้:

### 1. ขอ Channel Access Token
1. เข้าสู่ระบบ [LINE Developers Console](https://developers.line.biz/)
2. เลือก Provider ของคุณ แล้วเลือก Channel ประเภท **Messaging API** (หากยังไม่มี ให้กดสร้าง Channel ประเภท Messaging API เพื่อเชื่อมกับบัญชี LINE Official Account ของคุณ)
3. ไปที่แท็บ **Messaging API** เลื่อนลงมาด้านล่างสุดตรงหัวข้อ **Channel access token (long-lived)**
4. กดปุ่ม **Issue** แล้วคัดลอก Token ทั้งหมดยาวๆ
5. นำ Token ไปใส่ในระบบ:
   - **วิธีที่ 1 (ผ่านหน้าเว็บ)**: เปิดหน้า `admin.html` > ไปที่แท็บ **"LINE OA & ตั้งค่า"** > วาง Token แล้วกด **บันทึก Channel Access Token**
   - **วิธีที่ 2 (ผ่าน Google Sheets)**: เปิดชีท `Settings` แถวที่มี Key `LineChannelAccessToken` ให้นำ Token ไปวางในช่อง Value

### 2. ติดตั้ง Webhook URL สำหรับแชทบอทตอบกลับอัตโนมัติ
1. ในหน้า [admin.html](./admin.html) แท็บ **"LINE OA & ตั้งค่า"** ให้กดปุ่ม **คัดลอก Webhook URL** (หรือนำ Web App URL ของ Google Apps Script ที่ลงท้ายด้วย `/exec`)
2. กลับไปที่ [LINE Developers Console](https://developers.line.biz/) ในหน้า Channel Messaging API
3. ในแท็บ **Messaging API** หัวข้อ **Webhook settings**:
   - กดปุ่ม **Edit** ในช่อง **Webhook URL** แล้ววาง URL ที่คัดลอกมา
   - กดปุ่ม **Update**
   - เลื่อนสวิตช์ **Use webhook** ให้เป็น **ON (เปิดใช้งานสีเขียว)**
   - กดปุ่ม **Verify** (ระบบจะขึ้นว่า Success)

### 3. ปิดข้อความตอบกลับอัตโนมัติเริ่มต้นของ LINE Official Account
เพื่อไม่ให้ข้อความ Auto-reply ทับซ้อนกับระบบแชทบอท:
1. เข้าสู่ระบบ [LINE Official Account Manager](https://manager.line.biz/)
2. ไปที่ **ตั้งค่า (Settings)** ที่มุมบนขวา > เลือก **ตั้งค่าการตอบกลับ (Response settings)**
3. กำหนดค่า:
   - **โหมดการตอบกลับ (Response mode):** เลือก `บอต (Bot)` หรือ `แชท (Chat)`
   - **ข้อความตอบกลับอัตโนมัติ (Auto-response messages):** เลือก `ปิด (Disabled)`
   - **Webhook:** เลือก `เปิด (Enabled)`

---

## 💬 คีย์เวิร์ดสำหรับแชทบอท LINE OA (Auto-Reply Engine)

เมื่อลูกค้าพิมพ์ข้อความเข้ามาใน LINE OA ระบบจะตอบกลับอัตโนมัติทันที:

| ข้อความที่ลูกค้าพิมพ์ | การตอบกลับของระบบ |
| :--- | :--- |
| **"สั่งอาหาร" / "เมนู" / "รอบวันนี้" / "หิว" / "กินไรดี"** | ส่ง Flex Message การ์ดเปิดรอบสั่งอาหาร พร้อมเมนูแนะนำและปุ่มกดสั่งผ่าน LIFF |
| **"เช็คสถานะ" / "สถานะออเดอร์" / "อาหารได้ยัง"** | ดึงออเดอร์ล่าสุดของลูกค้ารายนั้น แล้วตอบกลับ Flex การ์ดแจ้งสถานะ (รอทำ / กำลังทำ / เสร็จแล้ว) |
| **"เลขบัญชี" / "โอนเงิน" / "ชำระเงิน" / "พร้อมเพย์"** | ส่งข้อมูลพร้อมเพย์ และชื่อบัญชี สำหรับโอนเงิน |
| **"ติดต่อร้าน" / "เบอร์โทร" / "แอดมิน"** | ส่งเบอร์โทรศัพท์ติดต่อและคำแนะนำ |
| **ส่งรูปภาพ (เช่น สลิปโอนเงิน)** | ตอบรับสลิปอัตโนมัติ แจ้งว่าได้รับแล้วและร้านค้าจะตรวจสอบให้ |
| **ข้อความอื่นๆ** | ส่งข้อความต้อนรับ พร้อมแถบ Quick Reply 4 ปุ่มลัด |

