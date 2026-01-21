# ✅ TÓM TẮT: ĐÃ CẬP NHẬT IP MÁY IN QUAY BARR

## 📋 Tình trạng

- ✅ **Bếp nóng:** 192.168.1.235 - In thành công
- ✅ **Bếp thịt:** 192.168.1.236 - In thành công  
- ❌ **Quầy Bar:** 192.168.2.234 - Lỗi (khác subnet)

**Nguyên nhân:** Máy in Quầy Bar ở subnet `192.168.2.x` nhưng PC và 2 máy in kia ở subnet `192.168.1.x`

---

## ✅ ĐÃ THỰC HIỆN

### 1. Cập nhật IP trong Database ✅

Đã chạy script `fix-quay-bar-ip.js` và cập nhật thành công:
- **IP cũ:** 192.168.2.234
- **IP mới:** 192.168.1.234
- **Trạng thái:** Đã cập nhật trong database

---

## 🔧 CẦN LÀM TIẾP

### Bước 1: Đổi IP trên Máy In (QUAN TRỌNG!)

Bạn cần đổi IP trực tiếp trên máy in QUAY BARR:

1. **Vào menu máy in:**
   - Nhấn nút **Menu** hoặc **Settings**
   - Tìm **Network Settings** hoặc **TCP/IP Settings**

2. **Đổi IP:**
   ```
   IP Address: 192.168.1.234
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1
   DHCP: Disable (giữ IP tĩnh)
   ```

3. **Lưu và khởi động lại máy in**

**Xem hướng dẫn chi tiết:** `HUONG-DAN-DOI-IP-MAY-IN.md`

---

### Bước 2: Test Kết nối

Sau khi đổi IP trên máy in:

```bash
# Test ping
ping 192.168.1.234

# Test port
Test-NetConnection -ComputerName 192.168.1.234 -Port 9100

# Test bằng script
cd printer-test
node check-printer-connection.js
```

---

## 📊 Danh sách máy in sau khi fix

| Máy in | IP | Subnet | Trạng thái |
|--------|-----|--------|------------|
| Bếp nóng | 192.168.1.235 | 192.168.1.x | ✅ Hoạt động |
| Bếp thịt | 192.168.1.236 | 192.168.1.x | ✅ Hoạt động |
| Quầy Bar | 192.168.1.234 | 192.168.1.x | ⏳ Cần đổi IP trên máy in |

---

## ✅ Checklist

- [x] Cập nhật IP trong database (192.168.1.234)
- [ ] Đổi IP trên máy in (192.168.1.234)
- [ ] Test ping: `ping 192.168.1.234`
- [ ] Test port: `Test-NetConnection -ComputerName 192.168.1.234 -Port 9100`
- [ ] Test in từ hệ thống POS

---

## 🎯 Kết quả mong đợi

Sau khi đổi IP trên máy in, tất cả 3 máy in sẽ:
- ✅ Cùng subnet với PC (192.168.1.x)
- ✅ Kết nối được qua IP
- ✅ In được từ hệ thống POS

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Xem file `HUONG-DAN-DOI-IP-MAY-IN.md` để biết cách đổi IP trên máy in
2. Chạy `node check-printer-connection.js` để test kết nối
3. Kiểm tra máy in đã khởi động lại sau khi đổi IP chưa

---

**Lưu ý:** Database đã được cập nhật, nhưng bạn **PHẢI đổi IP trên máy in** thì mới kết nối được!















