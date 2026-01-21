# HƯỚNG DẪN ĐỔI IP MÁY IN QUAY BARR

## 📋 Tình trạng hiện tại

- ✅ **Bếp nóng:** 192.168.1.235 - In thành công
- ✅ **Bếp thịt:** 192.168.1.236 - In thành công  
- ❌ **Quầy Bar:** 192.168.2.234 - Lỗi (khác subnet)

**Vấn đề:** Máy in Quầy Bar ở subnet `192.168.2.x` nhưng PC và 2 máy in kia ở subnet `192.168.1.x`

---

## 🎯 GIẢI PHÁP

Đổi IP máy in **QUAY BARR** từ `192.168.2.234` → `192.168.1.234` để cùng subnet với PC và 2 máy in kia.

---

## 🔧 BƯỚC 1: Cập nhật IP trong Database

Chạy script để cập nhật IP trong database:

```bash
cd printer-test
node fix-quay-bar-ip.js
```

Script sẽ cập nhật IP từ `192.168.2.234` → `192.168.1.234` trong database.

---

## 🔧 BƯỚC 2: Đổi IP trên Máy In

### Cách 1: Qua Menu Máy In (Khuyến nghị)

1. **Bật máy in** và đợi khởi động hoàn tất

2. **Vào menu máy in:**
   - Nhấn nút **Menu** hoặc **Settings** trên máy in
   - Tìm **Network Settings** hoặc **TCP/IP Settings**

3. **Tìm mục IP Address:**
   - Chọn **IP Address** hoặc **TCP/IP**
   - Chọn **Manual** hoặc **Static IP**

4. **Nhập IP mới:**
   ```
   IP Address: 192.168.1.234
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1
   ```
   (Thay `192.168.1.1` bằng gateway của mạng bạn nếu khác)

5. **Tắt DHCP:**
   - Đảm bảo **DHCP** = **Disable** hoặc **Off**
   - Để giữ IP tĩnh

6. **Lưu cài đặt:**
   - Nhấn **Save** hoặc **OK**
   - Máy in sẽ khởi động lại để áp dụng cài đặt mới

### Cách 2: Qua Web Interface (Nếu máy in hỗ trợ)

1. **Tìm IP hiện tại của máy in:**
   - In test page từ máy in (nếu có)
   - Hoặc xem trên màn hình máy in

2. **Mở trình duyệt:**
   - Truy cập: `http://192.168.2.234` (IP cũ)
   - Đăng nhập nếu có (thường là admin/admin hoặc không có password)

3. **Vào Network Settings:**
   - Tìm **Network** → **TCP/IP** hoặc **Network Settings**

4. **Đổi IP:**
   - **IP Address:** `192.168.1.234`
   - **Subnet Mask:** `255.255.255.0`
   - **Gateway:** `192.168.1.1`
   - **DHCP:** Disable

5. **Lưu và khởi động lại máy in**

---

## ✅ BƯỚC 3: Kiểm tra Kết nối

### 1. Test Ping

```bash
ping 192.168.1.234
```

**Kết quả mong đợi:**
```
Reply from 192.168.1.234: bytes=32 time<1ms TTL=64
```

Nếu ping thành công → ✅ Máy in đã đổi IP thành công!

### 2. Test Port 9100

```powershell
Test-NetConnection -ComputerName 192.168.1.234 -Port 9100
```

**Kết quả mong đợi:**
```
TcpTestSucceeded : True
```

### 3. Test bằng Script

```bash
cd printer-test
node check-printer-connection.js
```

Script sẽ tự động test kết nối tới máy in.

---

## 🔄 Nếu Không Thể Đổi IP trên Máy In

Nếu không thể đổi IP trên máy in (không có menu hoặc bị khóa), có thể:

### Giải pháp thay thế: Dùng Router/Network Bridge

1. **Cấu hình router** để cho phép giao tiếp giữa 2 subnet:
   - Subnet 1: `192.168.1.x`
   - Subnet 2: `192.168.2.x`

2. **Hoặc dùng network bridge** để kết nối 2 mạng

**Lưu ý:** Giải pháp này phức tạp hơn và cần kiến thức về networking.

---

## 📋 CHECKLIST

Sau khi đổi IP, kiểm tra:

- [ ] Đã cập nhật IP trong database (`fix-quay-bar-ip.js`)
- [ ] Đã đổi IP trên máy in (192.168.1.234)
- [ ] Ping thành công: `ping 192.168.1.234`
- [ ] Port 9100 mở: `Test-NetConnection -ComputerName 192.168.1.234 -Port 9100`
- [ ] Test in thành công từ hệ thống POS

---

## 🎯 TÓM TẮT

**Mục tiêu:** Đổi IP máy in QUAY BARR từ `192.168.2.234` → `192.168.1.234`

**Các bước:**
1. ✅ Cập nhật database: `node fix-quay-bar-ip.js`
2. ✅ Đổi IP trên máy in: Menu → Network Settings → IP: 192.168.1.234
3. ✅ Test: `ping 192.168.1.234`

**Sau khi hoàn tất, tất cả 3 máy in sẽ cùng subnet và in được! ✅**

---

## 💡 LƯU Ý

1. **Chọn IP không trùng:**
   - Bếp nóng: `192.168.1.235`
   - Bếp thịt: `192.168.1.236`
   - Quầy Bar: `192.168.1.234` ✅

2. **Gateway:**
   - Thường là `192.168.1.1` hoặc `192.168.1.254`
   - Kiểm tra gateway của mạng bạn: `ipconfig` → Default Gateway

3. **Sau khi đổi IP:**
   - Máy in sẽ khởi động lại
   - Đợi 30-60 giây để máy in khởi động xong
   - Sau đó mới test ping

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra máy in đã khởi động lại chưa
2. Kiểm tra IP đã đổi đúng chưa (in test page)
3. Test ping từ PC
4. Xem file `HUONG-DAN-KIEM-TRA.md` để biết cách debug















