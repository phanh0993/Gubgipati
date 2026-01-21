# 📱 LINK KẾT NỐI ĐIỆN THOẠI

## 🚀 CÁCH NHANH NHẤT

### Bước 1: Khởi động hệ thống ở chế độ Network

**Double-click file:**
```
START-NETWORK.bat
```

Script sẽ tự động:
- ✅ Tìm IP máy bạn
- ✅ Khởi động Backend, Printer Server, React
- ✅ Hiển thị link truy cập

### Bước 2: Xem IP trong cửa sổ CMD

Sau khi script chạy, sẽ hiển thị:
```
📡 IP máy này: 192.168.1.17

📡 Truy cập từ máy KHÁC cùng WiFi:
   👉 http://192.168.1.17:3000
```

### Bước 3: Truy cập từ điện thoại

**Trên điện thoại:**
1. ✅ Kết nối cùng WiFi với máy chủ
2. ✅ Mở Chrome/Safari
3. ✅ Nhập link: `http://192.168.1.17:3000`
4. ✅ Đăng nhập

---

## 📱 CÁC LINK QUAN TRỌNG

### 1. Mobile POS (Khuyên dùng cho nhân viên)

**Link:** `http://192.168.1.17:3000/mobile-login`

**Tính năng:**
- ✅ Đăng nhập nhân viên
- ✅ Chọn bàn
- ✅ Order món
- ✅ Thanh toán
- ✅ Xem hóa đơn
- ✅ In bill (qua queue)

**Đăng nhập:**
- Username: (tên nhân viên)
- Password: (mật khẩu nhân viên)

### 2. Admin Login (Cho quản lý)

**Link:** `http://192.168.1.17:3000/login`

**Đăng nhập:**
- Username: `admin`
- Password: `admin123`

**Tính năng:**
- ✅ Dashboard thống kê
- ✅ Quản lý bàn, món ăn, nhân viên
- ✅ Xem báo cáo
- ✅ Quản lý máy in

### 3. POS Desktop (Cho PC)

**Link:** `http://192.168.1.17:3000/buffet-tables`

**Tính năng:**
- ✅ Chọn bàn
- ✅ Order món
- ✅ In bill trực tiếp
- ✅ Thanh toán

---

## 🔍 TÌM IP MÁY CHỦ

### Cách 1: Xem trong START-NETWORK.bat

Script sẽ tự động hiển thị IP sau khi chạy.

### Cách 2: Chạy lệnh Windows

**CMD:**
```bash
ipconfig
```

Tìm dòng:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.17
```

### Cách 3: PowerShell

**PowerShell:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
```

---

## ⚙️ CẤU HÌNH FIREWALL

### Windows Firewall có thể chặn port 3000

**Cách 1: Cho phép port (Khuyên dùng)**

**CMD (Run as Administrator):**
```bash
netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3000

netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=8000

netsh advfirewall firewall add rule name="Printer Server" dir=in action=allow protocol=TCP localport=9977
```

**Cách 2: Tắt firewall tạm thời (Test)**

1. Windows Defender Firewall
2. Turn off (Private & Public)
3. Test lại

---

## 🧪 KIỂM TRA KẾT NỐI

### Từ điện thoại:

**Bước 1:** Ping máy chủ

**Android:** Dùng app "Ping Tools"  
**iOS:** Dùng app "Network Ping Lite"

Ping: `192.168.1.17`

**Bước 2:** Test URL

Mở browser, vào:
```
http://192.168.1.17:3000
```

Nếu thấy trang login → ✅ Kết nối OK!

---

## 📋 CHECKLIST

### Trên máy chủ (PC):
- [ ] Chạy `START-NETWORK.bat`
- [ ] Firewall allow port 3000, 8000, 9977
- [ ] Xem IP: `ipconfig`
- [ ] Test local: http://localhost:3000

### Trên điện thoại:
- [ ] Cùng WiFi với máy chủ
- [ ] Ping được IP máy chủ
- [ ] Vào: http://[IP]:3000
- [ ] Đăng nhập thành công

---

## 🎯 IP HIỆN TẠI

**IP máy này:** `192.168.1.17`

**Link truy cập từ điện thoại:**
- Mobile POS: `http://192.168.1.17:3000/mobile-login`
- Admin: `http://192.168.1.17:3000/login`
- POS Desktop: `http://192.168.1.17:3000/buffet-tables`

---

## ⚠️ LƯU Ý

1. **Cùng WiFi:** Điện thoại và máy chủ phải cùng WiFi
2. **IP thay đổi:** IP có thể thay đổi mỗi lần kết nối WiFi
3. **Firewall:** Đảm bảo firewall không chặn port 3000
4. **Backend:** Backend chỉ chạy trên máy chủ (localhost:8000)
5. **Printer Server:** Chỉ chạy trên máy chủ (localhost:9977)

---

## 🎉 HOÀN TẤT!

**Sau khi setup:**
- ✅ Tất cả máy cùng WiFi truy cập được
- ✅ Mỗi điện thoại có thể đăng nhập riêng
- ✅ POS Mobile hoạt động từ xa
- ✅ In bill qua máy chủ (queue system)

**Hệ thống đa thiết bị hoàn chỉnh!** 🚀

---

**Cập nhật:** 06/11/2025  
**IP hiện tại:** 192.168.1.17

---

## 🖨️ CÁCH BẬT DHCP TRÊN MÁY IN MẠNG

### Thông Tin Máy In
- **IP Address:** 192.168.2.234
- **Subnet Mask:** 255.255.255.0
- **Gateway:** 192.168.2.1

### ⚠️ LƯU Ý QUAN TRỌNG

**Bật DHCP nghĩa là:**
- ✅ Máy in sẽ tự động nhận IP từ router/switch
- ✅ IP có thể thay đổi mỗi lần khởi động lại
- ❌ Không giữ IP cố định 192.168.2.234

**Nếu muốn giữ IP cố định:** Nên dùng **DHCP Reservation** trên router thay vì bật DHCP trên máy in.

---

## 🔧 CÁCH 1: QUA WEB INTERFACE MÁY IN (Khuyên dùng)

### Bước 1: Truy cập Web Interface

Mở trình duyệt, vào:
```
http://192.168.2.234
```

Hoặc thử:
```
http://192.168.2.234:80
```

### Bước 2: Đăng nhập (nếu cần)

- Thông thường mặc định: `admin` / `admin`
- Hoặc `admin` / `password`
- Hoặc không cần mật khẩu

### Bước 3: Tìm Cài Đặt Mạng

**Tìm các menu như:**
- Network Settings / Cài đặt Mạng
- TCP/IP Settings / Cài đặt TCP/IP
- Network Configuration / Cấu hình Mạng
- IP Settings / Cài đặt IP

### Bước 4: Chuyển Sang DHCP

1. ✅ Tìm **"IP Configuration"** hoặc **"Obtain IP Address"**
2. ✅ Chọn **"DHCP"** hoặc **"Auto"** (thay vì Static/Manual)
3. ✅ **Lưu** hoặc **Apply** cài đặt
4. ✅ Máy in sẽ tự động khởi động lại

---

## 🔧 CÁCH 2: QUA PHẦN MỀM QUẢN LÝ MÁY IN

### Bước 1: Mở Phần Mềm Quản Lý

**Windows:**
1. Settings > Devices > Printers & scanners
2. Chọn máy in > Manage > Printer properties
3. Vào tab **Ports** hoặc **Configuration**

**Hoặc dùng phần mềm của hãng:**
- Epson: EpsonNet Config
- Canon: Canon Network Tool
- HP: HP Printer Utility

### Bước 2: Cấu Hình DHCP

1. ✅ Tìm **"Network Settings"** hoặc **"TCP/IP Settings"**
2. ✅ Chọn **"Obtain IP address automatically (DHCP)"**
3. ✅ Bỏ tích **"Use static IP address"**
4. ✅ **Apply** hoặc **OK**

---

## 🔧 CÁCH 3: QUA LCD PANEL TRÊN MÁY IN

### Bước 1: Vào Menu Máy In

1. ✅ Bấm nút **Menu** hoặc **Settings** trên máy in
2. ✅ Điều hướng bằng nút mũi tên
3. ✅ Tìm **"Network"** hoặc **"TCP/IP"**

### Bước 2: Chuyển Sang DHCP

1. ✅ Chọn **"TCP/IP Settings"**
2. ✅ Chọn **"IP Address"** hoặc **"IP Configuration"**
3. ✅ Chọn **"DHCP"** hoặc **"Auto"**
4. ✅ **OK** hoặc **Save**

### Bước 3: Xác Nhận

1. ✅ Máy in sẽ tự động lấy IP mới từ router
2. ✅ Ghi lại IP mới (có thể xem trên LCD hoặc in test page)

---

## 🔧 CÁCH 4: CẤU HÌNH DHCP RESERVATION (Khuyên dùng để giữ IP cố định)

### Mục đích:
- ✅ Máy in luôn nhận IP **192.168.2.234** từ router
- ✅ Vẫn dùng DHCP nhưng IP không đổi

### Bước 1: Tìm MAC Address Máy In

**Cách 1: Qua Web Interface**
```
http://192.168.2.234
Vào Network Settings > xem MAC Address
```

**Cách 2: In Test Page**
- Bấm nút trên máy in > Print Configuration
- Tìm dòng **MAC Address** hoặc **Hardware Address**

**Cách 3: Qua CMD**
```bash
arp -a 192.168.2.234
```

### Bước 2: Đăng Nhập Router

1. ✅ Mở trình duyệt: `http://192.168.2.1`
2. ✅ Đăng nhập router (thường: `admin` / `admin`)

### Bước 3: Cấu Hình DHCP Reservation

**Tìm menu:**
- DHCP Reservation / Đặt chỗ DHCP
- Static DHCP / DHCP Tĩnh
- Address Reservation / Đặt chỗ Địa chỉ

**Cấu hình:**
1. ✅ Chọn **Add** hoặc **New Reservation**
2. ✅ Nhập **MAC Address** của máy in
3. ✅ Nhập **IP Address:** `192.168.2.234`
4. ✅ Nhập **Description:** `May In`
5. ✅ **Save** hoặc **Apply**

### Bước 4: Khởi Động Lại Máy In

1. ✅ Tắt máy in
2. ✅ Đợi 10 giây
3. ✅ Bật lại
4. ✅ Máy in sẽ nhận IP **192.168.2.234** từ router

---

## 🧪 KIỂM TRA SAU KHI BẬT DHCP

### Bước 1: Kiểm Tra IP Mới

**Cách 1: In Configuration Page**
- Bấm nút trên máy in > Print Configuration
- Xem IP Address trong bản in

**Cách 2: Qua Web Interface**
- Thử các IP: `192.168.2.1` đến `192.168.2.254`
- Hoặc dùng phần mềm quét mạng (Advanced IP Scanner)

**Cách 3: Qua Router**
- Đăng nhập router `http://192.168.2.1`
- Vào **DHCP Client List** hoặc **Attached Devices**
- Tìm máy in theo tên hoặc MAC Address

### Bước 2: Kiểm Tra Kết Nối

```bash
# Ping IP máy in
ping 192.168.2.234

# Hoặc ping IP mới nếu đã thay đổi
ping [IP_MOI]
```

### Bước 3: Test In

1. ✅ Cập nhật IP mới trong hệ thống
2. ✅ Test in từ ứng dụng
3. ✅ Kiểm tra kết quả

---

## ⚠️ LƯU Ý

### 1. IP Có Thể Thay Đổi

**Khi bật DHCP:**
- IP có thể thay đổi mỗi lần khởi động
- Cần cập nhật IP mới trong hệ thống
- Hoặc dùng **DHCP Reservation** để giữ IP cố định

### 2. Cùng Mạng

- ✅ Máy in và PC phải cùng mạng `192.168.2.x`
- ✅ Subnet mask phải `255.255.255.0`
- ✅ Gateway phải `192.168.2.1`

### 3. Router DHCP Phải Bật

- ✅ Đảm bảo router có bật DHCP Server
- ✅ DHCP Range phải bao gồm `192.168.2.234`

### 4. Nếu Mất Kết Nối

**Sau khi bật DHCP:**
- Máy in có thể nhận IP khác (không phải 192.168.2.234)
- Cần tìm IP mới qua router hoặc phần mềm quét mạng
- Cập nhật IP mới trong hệ thống

---

## 📋 CHECKLIST

### Trước Khi Bật DHCP:
- [ ] Ghi lại MAC Address máy in
- [ ] Ghi lại IP hiện tại: 192.168.2.234
- [ ] Đăng nhập được web interface máy in
- [ ] Router có bật DHCP Server

### Sau Khi Bật DHCP:
- [ ] Máy in khởi động lại thành công
- [ ] Tìm được IP mới của máy in
- [ ] Ping được IP mới
- [ ] Truy cập được web interface với IP mới
- [ ] Test in thành công với IP mới
- [ ] Cập nhật IP mới trong hệ thống

---

## 🎯 KHUYẾN NGHỊ

### ✅ Nên Dùng DHCP Reservation

**Lý do:**
- ✅ Giữ IP cố định 192.168.2.234
- ✅ Vẫn dùng DHCP (tự động cấu hình)
- ✅ Không cần cập nhật IP trong hệ thống
- ✅ Dễ quản lý qua router

### ❌ Không Nên Dùng DHCP Thuần

**Lý do:**
- ❌ IP thay đổi mỗi lần khởi động
- ❌ Phải cập nhật IP mới mỗi lần
- ❌ Có thể mất kết nối nếu không biết IP mới

---

## ❓ DHCP DISABLE CÓ KẾT NỐI QUA IP ĐƯỢC KHÔNG?

### ✅ CÓ - Vẫn kết nối được qua IP bình thường!

**Khi DHCP bị tắt (disable):**
- ✅ Máy in sử dụng **IP tĩnh (Static IP)**
- ✅ Vẫn kết nối qua IP như bình thường
- ✅ IP không thay đổi (luôn là 192.168.2.234)
- ✅ Không phụ thuộc vào router DHCP

### 🔍 SỰ KHÁC BIỆT

**DHCP Enabled (Bật):**
- Máy in tự động nhận IP từ router
- IP có thể thay đổi mỗi lần khởi động
- Cần router có bật DHCP Server

**DHCP Disabled (Tắt - Static IP):**
- Máy in dùng IP cố định (192.168.2.234)
- IP không bao giờ thay đổi
- **Không cần** router có bật DHCP Server
- Vẫn kết nối qua IP bình thường

### ✅ ĐIỀU KIỆN ĐỂ KẾT NỐI QUA IP (DHCP Disable)

1. **IP được cấu hình đúng:**
   - IP Address: `192.168.2.234`
   - Subnet Mask: `255.255.255.0`
   - Gateway: `192.168.2.1`

2. **Cùng mạng:**
   - PC và máy in cùng mạng `192.168.2.x`
   - Subnet mask phải giống nhau: `255.255.255.0`

3. **Không có firewall chặn:**
   - Firewall không chặn port 9100 (hoặc port máy in dùng)
   - Router không chặn kết nối nội bộ

4. **Cable/WiFi kết nối tốt:**
   - Máy in đã kết nối mạng (Ethernet hoặc WiFi)
   - Đèn mạng trên máy in sáng

### 🧪 KIỂM TRA KẾT NỐI KHI DHCP DISABLE

**Bước 1: Ping máy in**
```bash
ping 192.168.2.234
```

**Nếu ping thành công:**
- ✅ Kết nối mạng OK
- ✅ IP đúng
- ✅ Cùng mạng

**Bước 2: Test port máy in**
```bash
telnet 192.168.2.234 9100
```

**Nếu kết nối được:**
- ✅ Port máy in mở
- ✅ Có thể in qua IP

**Bước 3: Truy cập Web Interface**
```
http://192.168.2.234
```

**Nếu truy cập được:**
- ✅ Web interface hoạt động
- ✅ Có thể quản lý máy in qua IP

### ⚠️ LƯU Ý KHI DHCP DISABLE

**Ưu điểm:**
- ✅ IP cố định, không thay đổi
- ✅ Dễ quản lý, không cần tìm IP mới
- ✅ Không phụ thuộc vào router DHCP
- ✅ Phù hợp cho môi trường production

**Nhược điểm:**
- ❌ Phải cấu hình thủ công IP, Subnet, Gateway
- ❌ Nếu đổi router/mạng, phải cấu hình lại
- ❌ Phải đảm bảo IP không trùng với thiết bị khác

### 🎯 KẾT LUẬN

**DHCP Disable:**
- ✅ **Vẫn kết nối qua IP được bình thường**
- ✅ Máy in dùng IP tĩnh (Static IP)
- ✅ Phù hợp khi muốn IP cố định
- ✅ Không cần router có DHCP Server

**Kết nối qua IP không phụ thuộc vào DHCP!**

---

**Hướng dẫn cập nhật:** 06/11/2025  
**Máy in:** 192.168.2.234 (Subnet: 255.255.255.0, Gateway: 192.168.2.1)




