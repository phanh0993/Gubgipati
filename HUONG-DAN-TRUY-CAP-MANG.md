# 🌐 HƯỚNG DẪN TRUY CẬP TỪ MÁY KHÁC CÙNG WIFI

**Mục đích:** Cho phép điện thoại/máy tính khác truy cập webapp qua WiFi

---

## ✅ CÁCH SỬ DỤNG NHANH

### Bước 1: Khởi động ở chế độ Network

**Double-click file:**
```
START-NETWORK.bat
```

Script sẽ tự động:
- ✅ Tìm IP máy bạn (VD: 192.168.1.100)
- ✅ Khởi động React với `HOST=0.0.0.0`
- ✅ Hiển thị URL truy cập

### Bước 2: Xem IP trong CMD

Sau khi script chạy, sẽ hiển thị:
```
📡 IP máy này: 192.168.1.100

Truy cập từ máy KHÁC:
👉 http://192.168.1.100:3000
```

### Bước 3: Truy cập từ điện thoại/máy khác

**Trên điện thoại:**
1. Kết nối cùng WiFi với máy chủ
2. Mở Chrome/Safari
3. Nhập: `http://192.168.1.100:3000`
4. Đăng nhập

---

## 🔧 CÁCH THỦ CÔNG (Nếu cần)

### 1. Tìm IP máy chủ

**Windows CMD:**
```bash
ipconfig
```

Tìm dòng:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### 2. Chỉnh package.json (Tùy chọn)

**File: `package.json`**
```json
"scripts": {
  "start": "set HOST=0.0.0.0 && react-scripts start",
  "start-local": "react-scripts start"
}
```

### 3. Hoặc tạo file .env.local

**File: `.env.local`**
```env
HOST=0.0.0.0
PORT=3000
```

### 4. Restart React

```bash
npm start
```

Sẽ hiển thị:
```
Local:            http://localhost:3000
On Your Network:  http://192.168.1.100:3000
```

---

## 📱 SỬ DỤNG TRÊN ĐIỆN THOẠI

### POS Mobile (Khuyên dùng):

**URL:** `http://192.168.1.100:3000/mobile-login`

**Tính năng:**
- ✅ Đăng nhập nhân viên
- ✅ Chọn bàn
- ✅ Order món (Buffet + Dịch vụ)
- ✅ Thanh toán
- ✅ Xem hóa đơn
- ✅ In bill

**Đăng nhập:**
```
Username: (tên nhân viên)
Password: (mật khẩu)
```

### Hoặc dùng tài khoản admin:

**URL:** `http://192.168.1.100:3000/login`

```
Username: admin
Password: admin123
```

---

## 🔥 FIREWALL (QUAN TRỌNG!)

### Windows Firewall có thể chặn port 3000

**Cách 1: Tắt firewall tạm thời (Test)**
1. Windows Defender Firewall
2. Turn off (Private & Public)
3. Test lại

**Cách 2: Cho phép port 3000 (Khuyên dùng)**

**CMD (Run as Administrator):**
```bash
netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3000

netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=8000

netsh advfirewall firewall add rule name="Printer Server" dir=in action=allow protocol=TCP localport=9977
```

---

## 🧪 KIỂM TRA KẾT NỐI

### Từ điện thoại:

**Bước 1:** Ping máy chủ

**Android:** Dùng app "Ping Tools"  
**iOS:** Dùng app "Network Ping Lite"

Ping: `192.168.1.100`

**Bước 2:** Test URL

Mở browser, vào:
```
http://192.168.1.100:3000
```

Nếu thấy trang login → ✅ Kết nối OK!

---

## ⚠️ LƯU Ý

### 1. Backend API & Printer Server

**Vấn đề:** Backend và Printer Server chạy trên `localhost`, máy khác không truy cập được.

**Giải pháp:**

#### Backend (Port 8000):
Máy khác cần gọi API qua IP máy chủ.

**Sửa `.env` trên máy khác (nếu cần):**
```env
REACT_APP_API_URL=http://192.168.1.100:8000
```

**NHƯNG** hiện tại webapp dùng **Supabase trực tiếp**, nên:
- ✅ Không cần backend cho data
- ✅ Chỉ cần backend cho login
- ✅ Có thể bỏ qua nếu dùng mobile POS (không cần login admin)

#### Printer Server (Port 9977):
Chỉ cần chạy trên 1 máy (máy kết nối máy in).

Các máy khác gọi in qua:
```
http://192.168.1.100:9977/print/image
```

**Sửa `billImageGenerator.ts` nếu cần:**
```typescript
const PRINTER_SERVER_URL = 'http://192.168.1.100:9977';
```

---

## 🎯 SCENARIO SỬ DỤNG

### Setup 1: Máy chủ + Nhiều điện thoại

**Máy chủ (PC):**
- Chạy: `START-NETWORK.bat`
- IP: 192.168.1.100

**Điện thoại 1 (Nhân viên A):**
- Vào: `http://192.168.1.100:3000/mobile-login`
- Login → Order món → Thanh toán

**Điện thoại 2 (Nhân viên B):**
- Vào: `http://192.168.1.100:3000/mobile-login`
- Login → Order món → Thanh toán

**PC Quản lý:**
- Vào: `http://192.168.1.100:3000`
- Login admin → Xem dashboard, báo cáo

---

## 🚀 KHỞI ĐỘNG CHO NETWORK

### File khuyên dùng:

```bash
START-NETWORK.bat
```

**Script sẽ:**
1. Kill processes cũ
2. Khởi động Backend
3. Khởi động Printer Server
4. Tìm IP tự động
5. Khởi động React với `HOST=0.0.0.0`
6. Hiển thị URL để truy cập

---

## ✅ CHECKLIST

### Trên máy chủ (PC):
- [ ] Chạy `START-NETWORK.bat`
- [ ] Firewall allow port 3000, 8000, 9977
- [ ] Xem IP: `ipconfig`
- [ ] Test local: http://localhost:3000

### Trên máy khác:
- [ ] Cùng WiFi với máy chủ
- [ ] Ping được IP máy chủ
- [ ] Vào: http://[IP]:3000
- [ ] Đăng nhập thành công

---

## 🎉 KẾT QUẢ

**Sau khi setup:**
- ✅ Tất cả máy cùng WiFi truy cập được
- ✅ Mỗi điện thoại có thể đăng nhập riêng
- ✅ POS Mobile hoạt động từ xa
- ✅ In bill qua máy chủ

**Hệ thống đa thiết bị hoàn chỉnh!** 🚀

