# 📱 LOGIC IN TỪ MOBILE HIỆN TẠI

**Ngày cập nhật:** 31/10/2025

---

## 🎯 TỔNG QUAN

**Vấn đề:**  
Điện thoại order từ xa (192.168.0.2:3000) không thể gọi `localhost:9977` (Printer Server) trực tiếp.

**Giải pháp:**  
Print Queue System - Mobile ghi lệnh in vào Supabase, PC poll và xử lý.

---

## 🔄 FLOW HOÀN CHỈNH

### Từ Mobile (Điện thoại):

```
1. User order món từ điện thoại
   URL: http://192.168.0.2:3000/mobile-menu
   
2. Click "Đặt order" / "Thanh toán"
   ↓
3. createOrder() / updateOrder() được gọi
   ↓
4. processPrintJobs(orderId, items, orderData)
   ↓
5. Detect: isMobileDevice() 
   → Check hostname != 'localhost'
   → TRUE (từ 192.168.0.2)
   ↓
6. sendPrintJobViaQueue() được gọi
   ↓
7. addToQueue() - Ghi vào Supabase:
   INSERT INTO mobile_print_queue (
     order_id: 163,
     items: [{name: "Vú heo", quantity: 1, food_item_id: 206}, ...],
     table_name: "Bàn 2",
     zone_name: "Khu A",
     staff_name: "Khánh Ly",
     status: "pending"
   )
   ↓
8. Console log: "✅ Đã thêm vào queue, PC sẽ xử lý"
   ↓
9. Mobile: Xong! (Không đợi in)
```

---

### Trên PC (Máy chủ):

```
1. React App khởi động (localhost:3000)
   ↓
2. PrintQueuePoller component mount
   ↓
3. Console log: "🔄 Print Queue Poller started"
   ↓
4. Poll mỗi 3 giây:
   SELECT * FROM mobile_print_queue 
   WHERE status = 'pending'
   ORDER BY created_at ASC
   LIMIT 10
   ↓
5. Tìm thấy job (ID: 53)
   Console: "📥 [QUEUE] Tìm thấy 1 lệnh in"
   ↓
6. Update status = 'processing'
   ↓
7. Lấy map_printer từ Supabase
   ↓
8. For each item trong job.items:
   ├─ Tìm printer được map
   ├─ Tạo template:
   │    DON HANG - Bếp
   │    ========================
   │    16:50 | Bàn 2 - Khu A | Khánh Ly
   │    ========================
   │    Vú heo - x1
   │    ========================
   ├─ Convert template → PNG (560x460px)
   └─ POST http://localhost:9977/print/image
        ↓
     [Printer Server - PC]
        ↓
     Convert PNG → ESC/POS
        ↓
     Gửi tới máy in (192.168.0.3:9100)
        ↓
     Phiếu in ra
   ↓
9. Xóa job khỏi queue:
   DELETE FROM mobile_print_queue WHERE id = 53
   ↓
10. Console: "✅ Job 53 hoàn tất: 2 thành công, 0 lỗi"
    ↓
11. Lặp lại sau 3 giây (poll tiếp)
```

---

## 📂 CÁC FILE LIÊN QUAN

### 1. `src/utils/printQueue.ts`
**Chức năng:**
- `isMobileDevice()` - Detect từ hostname
- `addToQueue()` - Insert vào mobile_print_queue
- `sendPrintJobViaQueue()` - Wrapper chọn queue/direct

**Code chính:**
```typescript
export const isMobileDevice = (): boolean => {
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
};

export const addToQueue = async (
  orderId, items, tableName, zoneName, staffName
) => {
  await supabase.from('mobile_print_queue').insert([{
    order_id: orderId,
    items: items,
    table_name: tableName,
    zone_name: zoneName,
    staff_name: staffName,
    status: 'pending'
  }]);
};
```

---

### 2. `src/components/PrintQueuePoller.tsx`
**Chức năng:**
- Poll queue mỗi 3s
- Lấy jobs pending
- Xử lý: Tạo phiếu → In → Xóa
- Chạy nền, không UI

**Code chính:**
```typescript
useEffect(() => {
  pollQueue(); // Poll ngay
  
  const interval = setInterval(() => {
    pollQueue(); // Poll mỗi 3s
  }, 3000);
  
  return () => clearInterval(interval);
}, []);

const pollQueue = async () => {
  const { data: jobs } = await supabase
    .from('mobile_print_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10);
  
  for (const job of jobs) {
    await processQueueJob(job);
  }
};
```

---

### 3. `src/services/api.ts` - processPrintJobs()
**Đã sửa:**
```typescript
const processPrintJobs = async (orderId, items, orderData) => {
  // ... Populate order data ...
  
  // ✅ CHECK MOBILE
  if (isMobileDevice()) {
    console.log('📱 Mobile → Queue');
    await sendPrintJobViaQueue(orderId, items, ...);
    return; // Dừng lại
  }
  
  // PC → In trực tiếp (logic cũ)
  for (const item of items) {
    await sendPrintJob(printer, [item], orderData);
  }
};
```

---

### 4. `src/App.tsx`
**Đã thêm:**
```tsx
<AuthProvider>
  <PrintQueuePoller />  ← Chạy nền
  <Router>...</Router>
</AuthProvider>
```

---

## 📊 TABLE SCHEMA

```sql
mobile_print_queue:
  id: 53
  order_id: 163
  items: [
    {name: "Vú heo", quantity: 1, food_item_id: 206},
    {name: "Ba chỉ", quantity: 2, food_item_id: 207}
  ]
  table_name: "Bàn 2"
  zone_name: "Khu A"
  staff_name: "Khánh Ly"
  print_type: "kitchen"
  status: "pending"
  created_at: "2025-11-05T11:00:15Z"
```

---

## ✅ ƯU ĐIỂM

### Mobile:
- ✅ Nhanh (không đợi in)
- ✅ Không cần kết nối máy in
- ✅ UX tốt

### PC:
- ✅ Tự động xử lý nền
- ✅ Poll mỗi 3s (realtime)
- ✅ Xóa sau khi in (không spam)

### Hệ thống:
- ✅ Robust (lỗi vẫn track được)
- ✅ Có log đầy đủ
- ✅ Scale tốt

---

## 🐛 LƯU Ý

**Lỗi compile hiện tại:** Đã sửa!
- ✅ sendPrintCommand → sendPrintJobViaQueue
- ✅ Bỏ import './printImageGenerator'
- ✅ Dùng function local trong PrintQueuePoller

**RESTART REACT VÀ TEST!** 🚀

