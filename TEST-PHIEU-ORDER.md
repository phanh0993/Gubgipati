# 🧪 TEST LOGIC IN PHIẾU ORDER

## 📋 LOGIC HIỆN TẠI

### Khi nào in phiếu?

**1. Tạo order mới (createOrder):**
```javascript
// src/services/api.ts - dòng 2515
await processPrintJobs(orderId, items, orderData);
```

**2. Update order (updateOrder):**
```javascript  
// src/services/api.ts - dòng ~2686
await processPrintJobs(orderId, items, orderData);
```

---

## 🔍 KIỂM TRA

### Bước 1: Mở Console (F12)

### Bước 2: Order món từ Mobile

1. Vào: http://192.168.0.2:3000/mobile-login
2. Login: ly / 091101
3. Chọn bàn
4. Chọn món
5. Thanh toán hoặc Đặt order

### Bước 3: Xem log console

**Log mẫu (ĐÚNG):**
```
🖨️ Processing print jobs for order: 163
📋 Populated order data: {table_name: "Bàn 2", zone_name: "Khu A", staff_name: "Khánh Ly"}
📋 Printer mappings found: 3
🖨️ Sending single-item ticket to POS-80C (Bếp): Vú heo x1
🎫 Kitchen ticket: 560x460px (CỐ ĐỊNH)
📄 Template content: DON HANG - Bếp
                    ========================
                    16:50 | Bàn 2 - Khu A | Khánh Ly
                    ========================
                    Vú heo - x1
                    ========================
📤 Sending to: http://localhost:9977/print/image
✅ Printed to POS-80C via Windows server
```

**Log lỗi (SAI):**
```
❌ Cannot print to POS-80C - Printer server not available
💡 Hãy chạy: cd windows-printer-server && node printer-server.js
```

---

## ✅ CHECKLIST

### Printer Server phải chạy:

**Kiểm tra:**
```
http://localhost:9977
```

Phải thấy:
```json
{
  "status": "running",
  "service": "ESC/POS Printer Server",
  "printer": "192.168.0.3:9100"
}
```

**Nếu không chạy:**
```bash
cd windows-printer-server
node printer-server.js
```

Hoặc:
```bash
printer-server-new.exe
```

---

### Map printer phải có:

**Kiểm tra trong Supabase:**

Table `map_printer`:
```
printer_id | food_item_id
-----------+-------------
11         | 206         (Món X → Máy bếp)
12         | 207         (Món Y → Máy bar)
...
```

**Tạo mapping:**
1. Vào: http://localhost:3000/printers
2. Tab "Quản lý"
3. Chọn máy in → Chọn món ăn
4. Lưu cấu hình

---

### Máy in phải online:

**Máy in POS-80C:**
- IP: 192.168.0.3
- Port: 9100
- Status: Online

**Test ping:**
```bash
ping 192.168.0.3
```

---

## 🐛 TROUBLESHOOTING

### ❌ Không thấy log "Processing print jobs"

**Nguyên nhân:** `processPrintJobs()` không được gọi

**Giải pháp:**
- Kiểm tra `USE_SUPABASE = true` trong console
- Restart React nếu cần

---

### ❌ Log "Cannot print - Printer server not available"

**Nguyên nhân:** Printer Server (port 9977) chưa chạy

**Giải pháp:**
```bash
cd windows-printer-server
node printer-server.js
```

---

### ❌ Log "Printer server responded non-OK"

**Nguyên nhân:** Printer Server lỗi khi xử lý

**Giải pháp:**
- Xem log trong cửa sổ Printer Server
- Kiểm tra máy in kết nối đúng chưa

---

## 🎯 KẾT LUẬN

**Logic in phiếu ĐÃ CÓ SẴN và hoạt động!**

Chỉ cần:
1. ✅ Printer Server chạy (localhost:9977)
2. ✅ Có map_printer
3. ✅ Máy in online

**RESTART REACT VÀ TEST!** 🚀

