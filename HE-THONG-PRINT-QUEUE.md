# 🔄 HỆ THỐNG PRINT QUEUE - IN TỪ MOBILE QUA PC

**Vấn đề:** Điện thoại không kết nối trực tiếp với máy in  
**Giải pháp:** Queue system - Mobile ghi lệnh in, PC đọc và xử lý

---

## 🎯 CÁCH HOẠT ĐỘNG

### Flow tổng quan:
```
[Điện thoại] Order món từ xa
     ↓
Detect: hostname != localhost (là mobile)
     ↓
Ghi vào table "mobile_print_queue" (Supabase)
  - order_id
  - items (JSONB)
  - table_name, zone_name, staff_name
  - status = 'pending'
     ↓
[Máy PC] Đang chạy webapp (localhost:3000)
     ↓
Component PrintQueuePoller chạy nền
     ↓
Poll queue mỗi 3 giây
     ↓
Tìm thấy lệnh in (status = 'pending')
     ↓
For each món:
  ├─ Lấy map_printer
  ├─ Tạo template phiếu
  ├─ Convert → PNG (560x460px)
  └─ POST localhost:9977/print/image
       ↓
    [Printer Server - Local PC]
       ↓
    Convert PNG → ESC/POS
       ↓
    Gửi tới máy in (192.168.0.3:9100)
       ↓
Xóa lệnh khỏi queue (tránh spam)
```

---

## 📋 SCHEMA BẢNG

### Table: `mobile_print_queue`

**Columns:**
```sql
id              SERIAL PRIMARY KEY
order_id        INTEGER NOT NULL
items           JSONB NOT NULL         -- [{name, quantity, food_item_id}, ...]
table_name      VARCHAR(100)
zone_name       VARCHAR(50)
staff_name      VARCHAR(100)
print_type      VARCHAR(20)            -- 'kitchen', 'bar', etc
status          VARCHAR(20)            -- 'pending', 'processing', 'failed'
created_at      TIMESTAMP DEFAULT NOW()
processed_at    TIMESTAMP
error_message   TEXT
```

**Sample data:**
```json
{
  "id": 53,
  "order_id": 163,
  "items": [
    {"name": "Vú heo", "quantity": 1, "food_item_id": 206},
    {"name": "Ba chỉ", "quantity": 2, "food_item_id": 207}
  ],
  "table_name": "Bàn 2",
  "zone_name": "Khu A",
  "staff_name": "Khánh Ly",
  "print_type": "kitchen",
  "status": "pending",
  "created_at": "2025-11-05T11:00:15Z"
}
```

---

## 🔧 CODE ĐÃ TẠO

### 1. `src/utils/printQueue.ts`

**Chức năng:**
- ✅ `isMobileDevice()` - Detect mobile/PC
- ✅ `addToQueue()` - Ghi vào bảng mobile_print_queue
- ✅ `sendPrintJobViaQueue()` - Wrapper chọn queue/direct

**Logic:**
```typescript
if (isMobileDevice()) {
  // Thêm vào queue
  await addToQueue(orderId, items, tableName, zoneName, staffName);
} else {
  // In trực tiếp (logic cũ)
  await sendPrintJob(...);
}
```

---

### 2. `src/components/PrintQueuePoller.tsx`

**Chức năng:**
- ✅ Poll queue mỗi 3 giây
- ✅ Lấy jobs có status = 'pending'
- ✅ Xử lý từng job:
  - Lấy map_printer
  - Tạo phiếu cho từng món
  - In qua localhost:9977
  - Xóa job sau khi xong
- ✅ Tránh chạy đồng thời (processingRef)

**Lifecycle:**
```typescript
useEffect(() => {
  // Poll ngay
  pollQueue();
  
  // Sau đó mỗi 3s
  setInterval(pollQueue, 3000);
  
  return cleanup;
}, []);
```

---

### 3. `src/services/api.ts` - processPrintJobs()

**Đã sửa:**
```typescript
// Thêm đoạn check mobile
if (isMobileDevice()) {
  // Mobile → Ghi vào queue
  await sendPrintJobViaQueue(orderId, items, ...);
  return; // Dừng lại
}

// PC → Tiếp tục logic in trực tiếp (như cũ)
```

---

### 4. `src/App.tsx`

**Đã thêm:**
```tsx
<AuthProvider>
  <PrintQueuePoller />  ← Chạy nền trên PC
  <Router>
    ...
  </Router>
</AuthProvider>
```

---

## 🧪 CÁCH TEST

### Bước 1: Đảm bảo PC chạy đầy đủ

**Máy PC:**
```bash
START-FINAL.bat
```

Phải có:
- ✅ Backend (8000)
- ✅ Printer Server (9977)
- ✅ React Webapp (3000) ← PrintQueuePoller chạy ở đây

**Console PC sẽ log:**
```
🔄 Print Queue Poller started (polling every 3s)
```

---

### Bước 2: Order từ điện thoại

**Điện thoại:**
1. Vào: http://192.168.0.2:3000/mobile-login
2. Login: ly / 091101
3. Chọn bàn
4. Order món (VD: Vú heo x1, Ba chỉ x2)
5. Đặt order

**Console điện thoại:**
```
📱 Mobile device → Thêm vào print queue
✅ Đã thêm vào queue (ID: 53), 2 món
✅ Đã thêm vào queue, PC sẽ xử lý
```

---

### Bước 3: Xem PC xử lý

**Console PC (sau ~3 giây):**
```
📥 [QUEUE] Tìm thấy 1 lệnh in
🖨️ [QUEUE] Processing job 53: Order 163, 2 món
✅ In thành công: Vú heo → POS-80C Bếp
✅ In thành công: Ba chỉ → POS-80C Bếp
✅ Job 53 hoàn tất: 2 thành công, 0 lỗi. Đã xóa khỏi queue.
```

**Máy in:**
- Phiếu 1: Vú heo x1
- Phiếu 2: Ba chỉ x2

---

## ✅ ƯU ĐIỂM

### Mobile:
- ✅ Không cần kết nối máy in
- ✅ Ghi queue rất nhanh
- ✅ UX tốt (không đợi in)

### PC:
- ✅ Tự động xử lý nền
- ✅ In đúng máy in theo map
- ✅ Retry nếu lỗi

### Hệ thống:
- ✅ Không spam (xóa sau khi in)
- ✅ Có log chi tiết
- ✅ Track status (pending/processing/failed)

---

## 🐛 TROUBLESHOOTING

### ❌ PC không poll queue

**Nguyên nhân:** PrintQueuePoller không chạy

**Giải pháp:**
- Kiểm tra console PC: Phải thấy "Print Queue Poller started"
- Restart React nếu cần

---

### ❌ Mobile không thêm vào queue

**Nguyên nhân:** isMobileDevice() return false

**Giải pháp:**
- Kiểm tra URL: Phải là http://192.168.0.2:3000 (không phải localhost)
- Xem console: Phải thấy "📱 Mobile device detected"

---

### ❌ Queue không được xóa (spam in)

**Nguyên nhân:** Lỗi khi in

**Giải pháp:**
- Xem console PC: Log chi tiết lỗi
- Check Printer Server chạy chưa
- Xóa thủ công nếu cần:
```sql
DELETE FROM mobile_print_queue WHERE status = 'failed';
```

---

## 🎉 KẾT LUẬN

**Hệ thống Print Queue đã hoàn chỉnh!**

✅ Mobile order → Ghi queue  
✅ PC poll mỗi 3s  
✅ Xử lý và xóa tự động  
✅ In đúng máy in theo map  

**RESTART REACT VÀ TEST!** 🚀

