# 🧪 TEST IN TỪ MOBILE QUA PC

**Mục đích:** Kiểm tra hệ thống print queue hoạt động

---

## 🎯 CHUẨN BỊ

### Máy PC (Máy chủ):

**1. Khởi động đầy đủ:**
```bash
START-FINAL.bat
```

**2. Kiểm tra các service:**

✅ **Backend API:**
```
http://localhost:8000/health
→ {"status":"OK"}
```

✅ **Printer Server:**
```
http://localhost:9977
→ {"status":"running"}
```

✅ **React Webapp:**
```
http://localhost:3000
→ Trang login
```

**3. Vào trang bất kỳ (để PrintQueuePoller chạy):**

Vào: `http://localhost:3000/buffet-tables` hoặc `/dashboard`

**4. Mở Console (F12), phải thấy:**
```
🔄 Print Queue Poller started (polling every 3s)
```

---

## 📱 TEST TỪ MOBILE

### Bước 1: Truy cập từ điện thoại

**URL:**
```
http://192.168.0.2:3000/mobile-login
```

**Đăng nhập:**
```
Username: ly
Password: 091101
```

---

### Bước 2: Order món

1. Chọn bàn (VD: Bàn A4)
2. Chọn vé buffet
3. Chọn 2-3 món
4. Click "Đặt order" hoặc "Thanh toán"

---

### Bước 3: Kiểm tra console mobile

**Phải thấy:**
```
🖨️ Processing print jobs for order: 164
📱 Mobile device → Thêm vào print queue
✅ Đã thêm vào queue (ID: 54), 3 món
✅ Đã thêm vào queue, PC sẽ xử lý
```

**KHÔNG thấy:**
- ❌ "POST localhost:9977" (vì mobile không gọi trực tiếp)
- ❌ Cửa sổ in chrome

---

### Bước 4: Kiểm tra Supabase (tùy chọn)

**Vào Supabase Dashboard:**

Table `mobile_print_queue` → Phải có record mới:
```json
{
  "id": 54,
  "order_id": 164,
  "items": [...],
  "table_name": "Bàn A4",
  "status": "pending"
}
```

---

### Bước 5: Xem PC tự động xử lý

**Console PC (sau 3-6 giây):**
```
📥 [QUEUE] Tìm thấy 1 lệnh in
🖨️ [QUEUE] Processing job 54: Order 164, 3 món
✅ In thành công: Vú heo → POS-80C Bếp
✅ In thành công: Ba chỉ → POS-80C Bếp
✅ In thành công: Soju → POS-80C Bar
✅ Job 54 hoàn tất: 3 thành công, 0 lỗi. Đã xóa khỏi queue.
```

---

### Bước 6: Kiểm tra máy in

**Máy in phải in ra 3 phiếu:**
```
Phiếu 1:
    DON HANG - Bếp
========================
16:50 | Bàn A4 - Khu A | Khánh Ly
========================
Vú heo - x1
========================

Phiếu 2:
    DON HANG - Bếp
========================
16:50 | Bàn A4 - Khu A | Khánh Ly
========================
Ba chỉ - x2
========================

Phiếu 3:
    DON HANG - Bar
========================
16:50 | Bàn A4 - Khu A | Khánh Ly
========================
Soju - x1
========================
```

---

## ✅ CHECKLIST

### Mobile:
- [ ] Vào được http://192.168.0.2:3000/mobile-login
- [ ] Login thành công (ly / 091101)
- [ ] Order món
- [ ] Console: "✅ Đã thêm vào queue"
- [ ] KHÔNG thấy window.print()
- [ ] KHÔNG gọi localhost:9977

### PC:
- [ ] Console: "🔄 Print Queue Poller started"
- [ ] Sau order mobile 3-6s: "📥 [QUEUE] Tìm thấy..."
- [ ] "✅ In thành công" cho từng món
- [ ] "✅ Job hoàn tất... Đã xóa"
- [ ] Máy in ra phiếu

### Supabase:
- [ ] Table mobile_print_queue có record khi mobile order
- [ ] Record bị xóa sau khi PC xử lý xong

---

## 🐛 TROUBLESHOOTING

### ❌ Console PC không thấy "Print Queue Poller started"

**Nguyên nhân:** Component chưa mount

**Giải pháp:**
- Vào trang bất kỳ: /dashboard, /buffet-tables
- Restart React nếu cần

---

### ❌ Mobile vẫn gọi localhost:9977

**Nguyên nhân:** isMobileDevice() = false

**Giải pháp:**
- Đảm bảo URL là http://192.168.0.2:3000 (không phải localhost)
- Check console: hostname phải là 192.168.0.2

---

### ❌ PC không poll queue

**Nguyên nhân:** Lỗi trong pollQueue()

**Giải pháp:**
- Xem console PC: Có lỗi gì không
- Check bảng mobile_print_queue tồn tại

---

### ❌ Queue không bị xóa (spam in)

**Nguyên nhân:** Lỗi khi in

**Giải pháp:**
- Xem log lỗi
- Xóa thủ công:
```sql
DELETE FROM mobile_print_queue WHERE status != 'pending';
```

---

## 🎉 KẾT QUẢ MONG ĐỢI

**Từ mobile:**
- Order nhanh
- Không đợi in
- Không lỗi localhost

**Trên PC:**
- Tự động poll
- In đúng phiếu
- Xóa sau khi xong

**Máy in:**
- Mỗi món 1 phiếu
- Đúng máy in theo map
- Không spam

**ĐÃ HOÀN HẢO!** 🚀

