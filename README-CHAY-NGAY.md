# 🚀 HƯỚNG DẪN CHẠY NGAY - GUBGIPATI

**Cập nhật:** 31/10/2025  
**Trạng thái:** ✅ Sẵn sàng sử dụng

---

## ⚡ CHẠY NHANH (3 BƯỚC)

### 1. Khởi động hệ thống

```bash
START-FINAL.bat
```

Đợi 60 giây, sẽ mở 3 cửa sổ:
- Backend API (Port 8000)
- Printer Server (Port 9977)  
- React Webapp (Port 3000)

### 2. Vào webapp

http://localhost:3000

### 3. Đăng nhập

```
Username: admin
Password: admin123
```

**XONG!** 🎉

---

## 📱 CÁC TRANG QUAN TRỌNG

### 🖥️ POS Desktop (PC):
- `/buffet-tables` - Chọn bàn, order món
- `/buffet-menu` - Menu buffet
- Chức năng: Order, In bill, Thanh toán

### 📱 POS Mobile:
- `/mobile-login` - Đăng nhập mobile
- `/mobile-tables` - Chọn bàn
- `/mobile-menu` - Order món
- `/mobile-bill` - Thanh toán
- `/mobile-invoices` - Xem hóa đơn
- Chức năng: Order, Thanh toán, In bill

### 🖨️ Test In Bill:
- `/test-printer` - Test in bill
- Chức năng: Tải ảnh PNG, In qua server

### 📊 Quản lý:
- `/dashboard` - Dashboard thống kê
- `/tables` - Quản lý bàn
- `/food` - Quản lý món ăn
- `/employees` - Quản lý nhân viên
- `/printers` - Quản lý máy in

---

## 🎯 TÍNH NĂNG IN BILL

**Phương pháp DUY NHẤT:**
1. Tạo ảnh bill PNG (Canvas HTML5)
2. Gửi tới Printer Server (localhost:9977)
3. Server convert PNG → ESC/POS bitmap
4. Gửi qua TCP/IP tới POS-80C (192.168.0.3:9100)
5. In ra giấy

**Hoạt động ở:**
- ✅ POS Desktop - Nút "In Bill"
- ✅ POS Mobile - Nút "In"
- ✅ Trang thanh toán
- ✅ Order details
- ✅ Test Printer

---

## 🔧 TROUBLESHOOTING

### ❌ Lỗi "Login failed"

**Giải pháp:**
```bash
# Kiểm tra backend chạy chưa
http://localhost:8000/health
→ Phải thấy: {"status":"OK"}

# Nếu không, restart backend
node simple-backend-server.js
```

### ❌ Lỗi "Lỗi kết nối server"

**Giải pháp:**
```bash
# Đảm bảo đã restart React sau khi sửa code
RESTART-REACT.bat

# Kiểm tra console log (F12):
USE_SUPABASE: true  ← Phải là true!
```

### ❌ Lỗi "In bill không thành công"

**Giải pháp:**
```bash
# Kiểm tra printer server
http://localhost:9977
→ Phải thấy: {"status":"running"}

# Nếu không, chạy printer server
cd windows-printer-server
node printer-server.js

# Hoặc dùng .exe
printer-server-new.exe
```

### ❌ Port bị chiếm

**Giải pháp:**
```bash
KILL-PORTS-AUTO.bat
```

---

## 📋 CHECKLIST KHI BẮT ĐẦU

- [ ] File `.env` đã tồn tại
- [ ] Dependencies đã cài (`npm install`)
- [ ] Backend chạy (port 8000) - `http://localhost:8000/health`
- [ ] Printer Server chạy (port 9977) - `http://localhost:9977`
- [ ] React đã compile xong - "Compiled successfully!"
- [ ] Console log: `USE_SUPABASE: true`
- [ ] Login thành công
- [ ] Trang /tables hiển thị bàn

---

## 🎉 HOÀN TẤT!

**Hệ thống đã sẵn sàng sử dụng!**

Tất cả tính năng:
- ✅ Quản lý bàn, món ăn, nhân viên
- ✅ POS Desktop & Mobile
- ✅ In bill qua ESC/POS
- ✅ Thanh toán, hóa đơn
- ✅ Dashboard thống kê

**Chúc bạn sử dụng hiệu quả!** 🚀

---

**Đọc thêm:**
- `THAY-THE-PHUONG-PHAP-IN-HOAN-TAT.md` - Chi tiết phương pháp in mới
- `BAO-CAO-TONG-KET-FINAL.md` - Báo cáo đầy đủ
- `SUA-LOI-CUOI-CUNG.md` - Sửa lỗi nếu cần

