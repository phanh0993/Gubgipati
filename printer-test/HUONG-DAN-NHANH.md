# 🚀 HƯỚNG DẪN NHANH: ĐỔI IP PC ĐỂ KẾT NỐI MÁY IN

## 📋 Tình trạng hiện tại
- **PC:** 192.168.1.17 (subnet 192.168.1.x)
- **Máy in:** 192.168.2.234 (subnet 192.168.2.x)
- **Vấn đề:** Khác subnet → Không kết nối được

---

## ✅ GIẢI PHÁP: Đổi IP PC sang 192.168.2.x

### 🔧 CÁCH 1: Dùng Script Tự Động (Dễ nhất)

1. **Click chuột phải** vào file `doi-ip-pc.bat`
2. Chọn **Run as administrator**
3. Nhập tên adapter (thường là `Ethernet` hoặc `Wi-Fi`)
4. Đợi script chạy xong
5. Test ping: `ping 192.168.2.234`

**Script sẽ tự động:**
- Đổi IP PC thành `192.168.2.100`
- Đặt Subnet Mask: `255.255.255.0`
- Đặt Gateway: `192.168.2.1`
- Test ping máy in

---

### 🔧 CÁCH 2: Đổi Thủ Công qua Command Prompt

1. Mở **Command Prompt** (Run as Administrator)
2. Xem tên adapter:
   ```bash
   netsh interface show interface
   ```
3. Đổi IP (thay `Ethernet` bằng tên adapter của bạn):
   ```bash
   netsh interface ip set address "Ethernet" static 192.168.2.100 255.255.255.0 192.168.2.1
   ```
4. Kiểm tra:
   ```bash
   ipconfig
   ping 192.168.2.234
   ```

---

### 🔧 CÁCH 3: Đổi qua Network Settings (Giao diện)

1. Nhấn `Windows + I` → **Network & Internet**
2. Chọn **Ethernet** hoặc **Wi-Fi**
3. Click vào adapter đang dùng
4. Kéo xuống **IP settings** → **Edit**
5. Chọn **Manual**
6. Nhập:
   - **IP address:** `192.168.2.100`
   - **Subnet mask:** `255.255.255.0`
   - **Gateway:** `192.168.2.1`
7. Click **Save**

---

## ✅ SAU KHI ĐỔI IP

### Bước 1: Kiểm tra IP mới
```bash
ipconfig
```
Kiểm tra xem IP đã đổi thành `192.168.2.100` chưa.

### Bước 2: Test ping máy in
```bash
ping 192.168.2.234
```
Nếu thấy "Reply from 192.168.2.234" → ✅ Thành công!

### Bước 3: Test kết nối máy in
```bash
cd printer-test
node check-printer-connection.js
```

---

## 🔄 ĐỔI LẠI VỀ IP CŨ

Nếu cần đổi lại về IP tự động (DHCP):

**Cách 1: Dùng script**
- Click chuột phải `doi-ip-pc-ve-dhcp.bat` → Run as administrator

**Cách 2: Command Prompt**
```bash
netsh interface ip set address "Ethernet" dhcp
netsh interface ip set dns "Ethernet" dhcp
```

---

## ⚠️ LƯU Ý

1. **Chọn IP không trùng:**
   - Máy in: `192.168.2.234`
   - PC: `192.168.2.100` (hoặc số khác từ 2-254, tránh 234)

2. **Mất kết nối Internet?**
   - Kiểm tra Gateway: `192.168.2.1`
   - Router có hỗ trợ subnet `192.168.2.x` không

3. **Cần quyền Administrator:**
   - Phải chạy Command Prompt/PowerShell với quyền Admin
   - Hoặc click chuột phải → Run as administrator

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Chạy: `node check-pc-network.js` để kiểm tra
2. Chụp màn hình kết quả `ipconfig`
3. Xem file `HUONG-DAN-DOI-IP-PC.md` để biết chi tiết

---

## 🎯 TÓM TẮT

**Mục tiêu:** Đổi IP PC từ `192.168.1.x` → `192.168.2.x`

**Cách nhanh nhất:**
1. Click chuột phải `doi-ip-pc.bat` → Run as administrator
2. Nhập tên adapter
3. Test: `ping 192.168.2.234`

**Nếu ping thành công → Hoàn tất! ✅**















