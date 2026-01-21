# HƯỚNG DẪN KIỂM TRA KẾT NỐI MÁY IN QUAY BARR

## Máy in: QUAY BARR
- **IP:** 192.168.2.234
- **Port:** 9100
- **Vị trí:** Quầy Bar

---

## 🔧 CÁCH 1: Sử dụng Script Tự Động

Chạy script kiểm tra chi tiết:

```bash
cd printer-test
node check-printer-connection.js
```

Script này sẽ tự động kiểm tra:
1. ✅ Ping tới máy in
2. ✅ Kết nối TCP port 9100
3. ✅ Test telnet
4. ✅ Thông tin mạng PC

---

## 🔍 CÁCH 2: Kiểm Tra Thủ Công

### Bước 1: Kiểm tra Ping

Mở Command Prompt hoặc PowerShell và chạy:

```bash
ping 192.168.2.234
```

**Kết quả mong đợi:**
```
Reply from 192.168.2.234: bytes=32 time<1ms TTL=64
```

**Nếu ping thành công:**
- ✅ Máy in đang online
- ✅ Mạng kết nối tốt
- → Tiếp tục bước 2

**Nếu ping thất bại:**
- ❌ Máy in có thể đang tắt
- ❌ IP address sai
- ❌ Máy in và PC khác mạng
- → Xem phần "Khắc phục lỗi Ping" bên dưới

---

### Bước 2: Kiểm tra Port 9100

#### Cách 2.1: Sử dụng PowerShell

```powershell
Test-NetConnection -ComputerName 192.168.2.234 -Port 9100
```

**Kết quả mong đợi:**
```
TcpTestSucceeded : True
```

#### Cách 2.2: Sử dụng Telnet

```bash
telnet 192.168.2.234 9100
```

**Nếu kết nối thành công:**
- Màn hình sẽ chuyển sang chế độ telnet (màn hình đen)
- Nhấn `Ctrl + ]` rồi gõ `quit` để thoát

**Nếu kết nối thất bại:**
- ❌ Port 9100 không mở
- ❌ Máy in chưa sẵn sàng nhận kết nối
- → Xem phần "Khắc phục lỗi Port"

---

### Bước 3: Kiểm tra Mạng PC

Xem IP của PC:

```bash
ipconfig
```

Tìm dòng **IPv4 Address**, ví dụ: `192.168.2.100`

**Kiểm tra subnet:**
- PC IP: `192.168.2.100` → Subnet: `192.168.2.x`
- Máy in IP: `192.168.2.234` → Subnet: `192.168.2.x`
- ✅ **Cùng subnet** → OK

**Nếu khác subnet:**
- PC: `192.168.1.100` (subnet `192.168.1.x`)
- Máy in: `192.168.2.234` (subnet `192.168.2.x`)
- ⚠️ **Khác subnet** → Cần router để kết nối

---

## 🛠️ KHẮC PHỤC LỖI

### ❌ Lỗi 1: Ping thất bại

**Nguyên nhân có thể:**
1. Máy in chưa bật
2. IP address sai
3. Máy in và PC khác mạng
4. Cáp mạng/WiFi bị lỗi

**Cách khắc phục:**

1. **Kiểm tra máy in:**
   - Bật máy in và đợi khởi động hoàn tất (30-60 giây)
   - Kiểm tra đèn báo trên máy in
   - Thử in test page từ máy in (nếu có nút test)

2. **Kiểm tra IP address:**
   - Vào menu máy in → **Network Settings** hoặc **TCP/IP Settings**
   - Xác nhận IP address là `192.168.2.234`
   - Nếu khác, cập nhật lại trong database hoặc cấu hình lại máy in

3. **Kiểm tra mạng:**
   - Đảm bảo máy in và PC cùng mạng LAN
   - Kiểm tra cáp mạng/WiFi kết nối
   - Thử kết nối máy in qua WiFi nếu đang dùng cáp (hoặc ngược lại)

4. **Kiểm tra router:**
   - Đăng nhập router admin
   - Kiểm tra xem có chặn giao tiếp giữa các thiết bị không
   - Tắt tính năng "AP Isolation" hoặc "Client Isolation" nếu có

---

### ❌ Lỗi 2: Port 9100 không mở

**Nguyên nhân có thể:**
1. Port 9100 bị tắt trong cài đặt máy in
2. Firewall chặn port 9100
3. Máy in không hỗ trợ raw printing

**Cách khắc phục:**

1. **Kiểm tra cài đặt máy in:**
   - Vào menu máy in → **Network Settings** → **Port Settings**
   - Đảm bảo **Raw Printing** hoặc **Port 9100** được bật
   - Một số máy in gọi là "TCP/IP Raw" hoặc "LPR"

2. **Kiểm tra firewall:**
   - Trên PC: Tắt Windows Firewall tạm thời để test
   - Trên máy in: Kiểm tra firewall settings (nếu có)

3. **Kiểm tra máy in hỗ trợ:**
   - Xem manual máy in có hỗ trợ "Raw Printing" hoặc "Port 9100" không
   - Một số máy in cần cấu hình thêm trong web interface

---

### ⚠️ Lỗi 3: Khác subnet

**Vấn đề:**
- PC: `192.168.1.x`
- Máy in: `192.168.2.x`

**Giải pháp:**

1. **Cách 1: Đổi IP máy in** (Khuyến nghị)
   - Đổi IP máy in về cùng subnet với PC
   - Ví dụ: PC `192.168.1.100` → Đổi máy in thành `192.168.1.234`
   - Cập nhật lại IP trong database

2. **Cách 2: Đổi IP PC**
   - Đổi IP PC về subnet `192.168.2.x`
   - Hoặc kết nối PC vào mạng `192.168.2.x`

3. **Cách 3: Dùng router**
   - Cấu hình router để cho phép giao tiếp giữa 2 subnet
   - Phức tạp hơn, cần kiến thức về networking

---

## 📋 CHECKLIST KIỂM TRA

Trước khi báo lỗi, hãy kiểm tra:

- [ ] Máy in đã được bật và khởi động hoàn tất
- [ ] Đèn báo trên máy in sáng bình thường
- [ ] IP address đúng: `192.168.2.234`
- [ ] PC và máy in cùng mạng LAN
- [ ] Ping thành công: `ping 192.168.2.234`
- [ ] Port 9100 mở: `Test-NetConnection -ComputerName 192.168.2.234 -Port 9100`
- [ ] Firewall không chặn port 9100
- [ ] Máy in hỗ trợ raw printing (port 9100)

---

## 🔗 LIÊN KẾT HỮU ÍCH

- Script test tự động: `check-printer-connection.js`
- Script test đơn giản: `test-printers.js`
- Danh sách máy in: `printers-list.json`

---

## 💡 LƯU Ý

1. **Máy in network không cần cài driver Windows** - Hệ thống in trực tiếp qua TCP/IP
2. **Port 9100 là port mặc định** cho raw printing trên hầu hết máy in network
3. **Nếu máy in ở xa**, có thể cần thời gian ping cao hơn (50-100ms) - điều này bình thường
4. **Sau khi thay đổi IP**, đợi 1-2 phút để máy in cập nhật cấu hình

---

**Nếu vẫn không kết nối được sau khi thử tất cả các bước trên, vui lòng:**
1. Chụp màn hình kết quả `check-printer-connection.js`
2. Chụp màn hình cài đặt mạng của máy in
3. Liên hệ hỗ trợ kỹ thuật















