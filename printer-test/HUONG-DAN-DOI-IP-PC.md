# HƯỚNG DẪN ĐỔI IP PC ĐỂ KẾT NỐI MÁY IN

## 📋 Thông tin máy in
- **IP:** 192.168.2.234
- **Subnet Mask:** 255.255.255.0
- **Gateway:** 192.168.2.1
- **Subnet:** 192.168.2.x

---

## 🎯 MỤC TIÊU
Đổi IP PC về subnet `192.168.2.x` để có thể kết nối với máy in qua IP.

---

## 🔧 CÁCH 1: Đổi IP qua Network Settings (Giao diện)

### Bước 1: Mở Network Settings

**Windows 10/11:**
1. Nhấn `Windows + I` để mở Settings
2. Chọn **Network & Internet**
3. Chọn **Ethernet** (nếu dùng cáp) hoặc **Wi-Fi** (nếu dùng WiFi)
4. Click vào tên adapter mạng đang dùng
5. Kéo xuống tìm **IP settings** → Click **Edit**

**Hoặc:**
1. Click chuột phải vào biểu tượng mạng ở taskbar
2. Chọn **Open Network & Internet settings**
3. Chọn **Change adapter options**
4. Click chuột phải vào adapter đang dùng → **Properties**
5. Chọn **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**

### Bước 2: Đổi sang IP tĩnh

1. Chọn **Use the following IP address**
2. Nhập thông tin:
   ```
   IP address: 192.168.2.100  (hoặc số khác từ 2-254, tránh 234)
   Subnet mask: 255.255.255.0
   Default gateway: 192.168.2.1
   ```
3. Nhập DNS (nếu cần):
   ```
   Preferred DNS server: 8.8.8.8
   Alternate DNS server: 8.8.4.4
   ```
   (Hoặc dùng DNS của nhà mạng)
4. Click **OK** → **OK**

### Bước 3: Kiểm tra

Mở Command Prompt và chạy:
```bash
ipconfig
```

Kiểm tra xem IP đã đổi thành `192.168.2.x` chưa.

---

## 🔧 CÁCH 2: Đổi IP qua Command Prompt (Nhanh hơn)

### Bước 1: Xem tên adapter

Mở Command Prompt (Run as Administrator) và chạy:
```bash
netsh interface show interface
```

Ghi lại tên adapter, ví dụ: `Ethernet` hoặc `Wi-Fi`

### Bước 2: Đổi IP

Chạy lệnh sau (thay `Ethernet` bằng tên adapter của bạn):

**Nếu dùng cáp (Ethernet):**
```bash
netsh interface ip set address "Ethernet" static 192.168.2.100 255.255.255.0 192.168.2.1
```

**Nếu dùng WiFi:**
```bash
netsh interface ip set address "Wi-Fi" static 192.168.2.100 255.255.255.0 192.168.2.1
```

**Đặt DNS (tùy chọn):**
```bash
netsh interface ip set dns "Ethernet" static 8.8.8.8
netsh interface ip add dns "Ethernet" 8.8.4.4 index=2
```

### Bước 3: Kiểm tra

```bash
ipconfig
```

---

## 🔧 CÁCH 3: Đổi IP qua PowerShell (Nhanh nhất)

Mở PowerShell (Run as Administrator) và chạy:

### Xem adapter hiện tại:
```powershell
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4'} | Format-Table
```

### Đổi IP (thay `Ethernet` bằng tên adapter):
```powershell
# Xóa IP cũ
Remove-NetIPAddress -InterfaceAlias "Ethernet" -Confirm:$false

# Thêm IP mới
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.2.100 -PrefixLength 24 -DefaultGateway 192.168.2.1

# Đặt DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 8.8.8.8,8.8.4.4
```

---

## ✅ SAU KHI ĐỔI IP

### Bước 1: Kiểm tra kết nối

```bash
ping 192.168.2.234
```

Nếu ping thành công → PC và máy in đã cùng mạng!

### Bước 2: Test kết nối máy in

```bash
cd printer-test
node check-printer-connection.js
```

### Bước 3: Test in thử

Nếu kết nối thành công, bạn có thể test in từ hệ thống POS.

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Chọn IP không trùng
- Máy in: `192.168.2.234`
- PC nên dùng: `192.168.2.100` hoặc số khác từ `2-254`
- Tránh dùng IP đã có thiết bị khác dùng

### 2. Backup cấu hình cũ
Trước khi đổi, ghi lại IP cũ để có thể đổi lại nếu cần:
```bash
ipconfig /all > network-backup.txt
```

### 3. Mất kết nối Internet?
Nếu sau khi đổi IP, PC mất kết nối Internet:
- Kiểm tra Gateway có đúng không (`192.168.2.1`)
- Kiểm tra DNS có đúng không
- Router có hỗ trợ subnet `192.168.2.x` không

### 4. Đổi lại về DHCP (nếu cần)
Nếu muốn đổi lại về tự động (DHCP):
```bash
netsh interface ip set address "Ethernet" dhcp
netsh interface ip set dns "Ethernet" dhcp
```

---

## 🔄 ĐỔI LẠI VỀ IP CŨ

Nếu cần đổi lại về IP cũ (DHCP hoặc IP tĩnh cũ):

### Qua Network Settings:
1. Mở Network Settings như trên
2. Chọn **Obtain an IP address automatically** (DHCP)
   - Hoặc nhập lại IP cũ nếu dùng IP tĩnh

### Qua Command Prompt:
```bash
netsh interface ip set address "Ethernet" dhcp
netsh interface ip set dns "Ethernet" dhcp
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Chạy script kiểm tra: `node check-pc-network.js`
2. Chụp màn hình kết quả `ipconfig`
3. Chụp màn hình cài đặt mạng
4. Liên hệ hỗ trợ kỹ thuật

---

## 🎯 TÓM TẮT NHANH

**Mục tiêu:** Đổi IP PC từ `192.168.1.x` → `192.168.2.x`

**Cách nhanh nhất:**
```bash
netsh interface ip set address "Ethernet" static 192.168.2.100 255.255.255.0 192.168.2.1
```

**Kiểm tra:**
```bash
ping 192.168.2.234
```

**Nếu ping thành công → Hoàn tất! ✅**















