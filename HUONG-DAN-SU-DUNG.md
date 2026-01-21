# 🏢 GUBGIPATI - HỆ THỐNG QUẢN LÝ NHÀ HÀNG

## 📋 TỔNG QUAN HỆ THỐNG

### Công nghệ sử dụng:
- **Frontend**: React 19 + TypeScript + Material-UI + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: Supabase PostgreSQL (cloud)
- **In Bill**: ESC/POS Printer Server (Windows) - Máy in POS-80C qua TCP/IP

### Tính năng chính:
✅ Quản lý bàn, khu vực, order  
✅ Quản lý khách hàng, nhân viên  
✅ Dashboard thống kê doanh thu  
✅ Tính lương, hoa hồng  
✅ **In bill qua ảnh ESC/POS RAW** (Phương án duy nhất)

---

## ⚙️ YÊU CẦU HỆ THỐNG

### 1. Phần mềm cần cài đặt:
- **Node.js** v18+ ([Download tại đây](https://nodejs.org/))
- **Git** (optional, để clone code)

### 2. Phần cứng:
- **Máy in**: POS-80C (80mm)  
  - Kết nối: TCP/IP  
  - IP: **192.168.0.3**  
  - Port: **9100**

### 3. Database:
- Supabase PostgreSQL (đã cấu hình sẵn qua .env)

---

## 🚀 HƯỚNG DẪN KHỞI ĐỘNG

### Bước 1: Cài đặt Dependencies (Chỉ lần đầu)

```bash
# Cài dependencies cho webapp
npm install

# Cài dependencies cho printer server
cd windows-printer-server
npm install
cd ..
```

### Bước 2: Cấu hình Environment

**Kiểm tra file `.env` trong thư mục gốc:**

```env
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ **Lưu ý**: File `.env` đã có sẵn, chứa thông tin kết nối Supabase thật. Không cần sửa gì.

### Bước 3: Khởi động hệ thống

#### Cách 1: Khởi động tự động (Đơn giản nhất)

```bash
# Double-click file này hoặc chạy trong CMD
START-FULL-SYSTEM.bat
```

File này sẽ tự động mở 2 cửa sổ:
- **Cửa sổ 1**: Printer Server (Port 9977)
- **Cửa sổ 2**: React Webapp (Port 3000)

#### Cách 2: Khởi động thủ công

**Terminal 1 - Printer Server:**
```bash
cd windows-printer-server
node printer-server.js
```

**Terminal 2 - React Webapp:**
```bash
npm start
```

---

## 🌐 TRUY CẬP HỆ THỐNG

### Sau khi khởi động thành công:

- **Webapp**: http://localhost:3000  
- **Printer Server**: http://localhost:9977  
- **Health Check**: http://localhost:9977/health

### Đăng nhập:
```
Username: admin
Password: admin123
```

---

## 🖨️ TÍNH NĂNG IN BILL MỚI

### Trang Test Printer: `/test-printer`

**Đặc điểm:**
- ✅ Chỉ còn **1 phương án in duy nhất**: Tạo bill ảnh PNG → In qua ESC/POS RAW
- ✅ Giao diện đơn giản, tối ưu
- ✅ 2 nút chính:
  - **"Tải ảnh bill"**: Download file PNG về máy
  - **"In bill qua server"**: Gửi ảnh tới server in, convert ESC/POS, in trực tiếp

**Flow hoạt động:**

```
[Webapp] → Tạo bill trên Canvas (576x600px)
         ↓
         Convert Canvas → PNG base64
         ↓
         POST http://localhost:9977/print/image
         ↓
[Printer Server] → Giải mã PNG
                 ↓
                 Convert PNG → ESC/POS Bitmap
                 ↓
                 Gửi TCP/IP tới 192.168.0.3:9100
                 ↓
[Máy in POS-80C] → In bill ra giấy
```

**Ví dụ sử dụng:**
1. Truy cập: http://localhost:3000/test-printer
2. Nhập thông tin: Bàn, Khu vực, Nhân viên, Ghi chú
3. Xem preview bill tự động cập nhật
4. Click **"In bill qua server"** → Bill được in ra ngay lập tức

---

## 🔧 TROUBLESHOOTING

### ❌ Lỗi: "Lỗi kết nối server in"

**Nguyên nhân:** Printer Server chưa chạy

**Giải pháp:**
```bash
cd windows-printer-server
node printer-server.js
```

Xem log console để đảm bảo server khởi động thành công:
```
╔════════════════════════════════════════════╗
║   ESC/POS PRINTER SERVER - ĐANG CHẠY     ║
╚════════════════════════════════════════════╝
🌐 Server: http://localhost:9977
🖨️  Máy in: 192.168.0.3:9100 (POS-80C)
```

---

### ❌ Lỗi: "ECONNREFUSED" hoặc không in được

**Nguyên nhân:** Máy in không kết nối hoặc IP sai

**Giải pháp:**
1. Kiểm tra máy in đã bật:
   ```bash
   ping 192.168.0.3
   ```
   
2. Nếu IP khác, sửa trong file `windows-printer-server/printer-server.js`:
   ```javascript
   const PRINTER_IP = '192.168.0.3';  // Đổi thành IP thật của máy in
   ```

3. Kiểm tra firewall không chặn port 9100

---

### ❌ Lỗi: "Missing Supabase configuration"

**Nguyên nhân:** File `.env` không tồn tại hoặc sai

**Giải pháp:**
1. Copy từ template:
   ```bash
   cp env.example .env
   ```

2. Điền đúng thông tin Supabase vào `.env`

3. Restart webapp:
   ```bash
   npm start
   ```

---

### ❌ In ra giấy trắng hoặc bị lỗi

**Nguyên nhân:** Ảnh bill quá to/nhỏ hoặc sai định dạng

**Giải pháp:**
1. Kiểm tra ảnh bill đúng 576px width (chuẩn 80mm)
2. Xem file PNG debug được lưu trong thư mục `windows-printer-server/`
3. Thử giảm brightness threshold trong code convert (dòng 47)

---

## 📁 CẤU TRÚC DỰ ÁN

```
Gubgipati-main/
├── src/                          # Frontend React
│   ├── pages/
│   │   └── TestPrinterPage.tsx  # ⭐ Trang in bill (đã tối ưu)
│   ├── components/
│   ├── contexts/
│   └── services/
│       └── supabaseClient.ts    # Kết nối Supabase
├── windows-printer-server/       # ⭐ Server in mới
│   ├── printer-server.js        # Main server (ESC/POS)
│   ├── printer-server-new.exe   # File .exe build sẵn
│   ├── package.json
│   ├── start-server.bat
│   └── HUONG-DAN.md
├── .env                          # Config Supabase
├── package.json
└── START-FULL-SYSTEM.bat        # ⭐ Khởi động tự động

```

---

## 📝 LOG & DEBUG

### Webapp Console:
```javascript
console.log('📤 Gửi lệnh in tới server...');
console.log('✅ Kết quả in:', result);
```

### Printer Server Console:
```
=== [PRINTER SERVER] Nhận request in bill ===
📄 Thông tin bill: { printer_name: 'POS-80C', ... }
✅ Đã decode PNG buffer: 45678 bytes
💾 Đã lưu file debug: bill_1234567890.png
🔄 Đang convert PNG sang ESC/POS bitmap...
✅ Convert xong: 87654 bytes ESC/POS command
🖨️  Kết nối tới máy in 192.168.0.3:9100...
✅ Đã kết nối tới máy in
📤 Đang gửi 87654 bytes tới máy in...
✅ Hoàn tất in bill (234ms)
```

---

## 🎯 CHECKLIST HOÀN THÀNH

✅ Webapp chạy local, kết nối Supabase cloud  
✅ Trang `/test-printer` chỉ còn 1 phương án in  
✅ Xóa toàn bộ code/method in cũ (ESC/POS Text, Raster, Network test...)  
✅ UI đơn giản, chỉ 2 nút: "Tải ảnh" & "In qua server"  
✅ Printer Server nhận ảnh PNG, convert ESC/POS bitmap, gửi tới máy in  
✅ Build file `.exe` sẵn để chạy không cần Node.js  
✅ Tài liệu đầy đủ, hướng dẫn troubleshooting  
✅ Code sạch, DRY, tuân thủ guideline  

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra log console của cả webapp và printer server
2. Test ping máy in: `ping 192.168.0.3`
3. Test server in: Mở http://localhost:9977 xem có hiện JSON không
4. Xem file PNG debug trong thư mục `windows-printer-server/`

---

## 🎉 HOÀN TẤT!

Hệ thống đã sẵn sàng sử dụng. Chúc bạn vận hành tốt! 🚀

**Phiên bản:** 1.0 - ESC/POS Printing System  
**Ngày cập nhật:** 2025-10-31

