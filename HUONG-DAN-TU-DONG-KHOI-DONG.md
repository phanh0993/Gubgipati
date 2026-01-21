# 🔄 HƯỚNG DẪN TỰ ĐỘNG KHỞI ĐỘNG KHI WINDOWS BẬT

**Mục đích:** Tự động chạy Gubgipati khi Windows khởi động

---

## ✅ CÁCH 1: STARTUP FOLDER (ĐƠN GIẢN NHẤT)

### Bước 1: Tạo Shortcut

1. **Chuột phải** vào file `START-FINAL.bat`
2. Chọn **"Create shortcut"**
3. Đổi tên shortcut: `Gubgipati Auto Start`

### Bước 2: Copy vào Startup

1. **Nhấn Win+R**
2. **Gõ:** `shell:startup`
3. **Enter** → Thư mục Startup mở ra
4. **Paste shortcut** vào đây

### Bước 3: Xong!

✅ Lần sau khởi động Windows, Gubgipati sẽ tự chạy!

---

## ✅ CÁCH 2: TASK SCHEDULER (CHUYÊN NGHIỆP)

### Tạo Task:

**Double-click file:**
```
CREATE-AUTO-START-TASK.bat
```

**Chạy với quyền Administrator** (Chuột phải → Run as administrator)

**Kết quả:**
```
✅ Task "Gubgipati Auto Start" đã được tạo
```

### Xóa Task (nếu cần):

**Double-click:**
```
DELETE-AUTO-START-TASK.bat
```

---

## 📋 SO SÁNH 2 CÁCH

| Tính năng | Startup Folder | Task Scheduler |
|-----------|----------------|----------------|
| **Độ khó** | ⭐ Rất dễ | ⭐⭐ Trung bình |
| **Quyền admin** | Không cần | Cần |
| **Tùy chỉnh** | Ít | Nhiều |
| **Khuyên dùng** | ✅ Cho người dùng | ✅ Cho IT/Admin |

---

## 🎯 SAU KHI SETUP

### Khi khởi động Windows:

**Tự động:**
1. ✅ Backend API khởi động (Port 8000)
2. ✅ Printer Server khởi động (Port 9977)
3. ✅ React Webapp khởi động (Port 3000)
4. ✅ PrintQueuePoller bắt đầu poll

**Chờ 60-90 giây → Hệ thống sẵn sàng!**

---

## 🛠️ QUẢN LÝ TASK SCHEDULER

### Xem task đã tạo:

**Win+R → Gõ:**
```
taskschd.msc
```

**Tìm:** "Gubgipati Auto Start"

### Tùy chỉnh:

**Chuột phải vào task → Properties:**
- ✅ Triggers: Khi nào chạy (Logon, Startup...)
- ✅ Actions: File nào chạy
- ✅ Conditions: Điều kiện (AC power...)
- ✅ Settings: Retry, timeout...

---

## 🐛 TROUBLESHOOTING

### ❌ Task không chạy

**Nguyên nhân:**
- Chưa đăng nhập Windows
- Task bị disable

**Giải pháp:**
1. Mở Task Scheduler
2. Tìm task
3. Chuột phải → Enable
4. Chuột phải → Run (test ngay)

---

### ❌ Task chạy nhưng lỗi

**Nguyên nhân:**
- Đường dẫn file sai
- Thiếu quyền

**Giải pháp:**
1. Check đường dẫn trong Task Properties
2. Đảm bảo "Run with highest privileges" được tick
3. Test chạy thủ công: START-FINAL.bat

---

## 💡 KHUYẾN NGHỊ

### Cho quán cà phê/nhà hàng:

**Setup 1 lần:**
1. Máy PC chính (thu ngân)
2. Cài Gubgipati
3. Setup auto start (Cách 1 hoặc 2)
4. Kết nối máy in
5. Thêm máy in vào webapp

**Từ đó:**
- ✅ Mỗi sáng mở máy → Hệ thống tự chạy
- ✅ Nhân viên chỉ cần vào URL
- ✅ Mobile POS hoạt động ngay
- ✅ Không cần IT support

---

## 🎉 KẾT LUẬN

**Có 2 cách:**

**1. Startup Folder** (Khuyên dùng)
- Đơn giản nhất
- 2 bước xong
- Không cần admin

**2. Task Scheduler**
- Chuyên nghiệp
- Nhiều tùy chỉnh
- Cần admin

**Chọn cách nào cũng OK!** 🚀

---

**Files đã tạo:**
- `CREATE-AUTO-START-TASK.bat` - Tạo task
- `DELETE-AUTO-START-TASK.bat` - Xóa task
- `HUONG-DAN-TU-DONG-KHOI-DONG.md` - File này

**CHÚC BẠN SỬ DỤNG TỐT!** 🎉
