# 🔐 HƯỚNG DẪN ĐĂNG NHẬP & SỬA LỖI LOGIN

## ❌ LỖI: "Login failed" - ERR_CONNECTION_REFUSED

### Nguyên nhân:
Backend API (port 8000) chưa chạy → Webapp không thể gọi API login.

---

## ✅ GIẢI PHÁP: Chạy đầy đủ Backend + Frontend

### Cách 1: Dùng file START hoàn chỉnh (KHUYÊN DÙNG) ⭐

**1. Double-click file:**
```
START-FULL-WITH-BACKEND.bat
```

**2. Chờ hệ thống khởi động (60-90 giây)**

Sẽ mở **3 cửa sổ CMD:**
- ✅ Backend API (Port 8000)
- ✅ Printer Server (Port 9977)
- ✅ React Webapp (Port 3000)

**3. Kiểm tra Backend đã chạy chưa:**

Mở browser: http://localhost:8000/health

Phải thấy:
```json
{
  "status": "OK",
  "message": "JULY SPA API Server is running",
  ...
}
```

**4. Chờ React compile xong**

Xem cửa sổ "React Webapp", đợi thấy:
```
Compiled successfully!
```

**5. Truy cập webapp:**

http://localhost:3000

**6. Đăng nhập:**
```
Username: admin
Password: admin123
```

---

### Cách 2: Chạy thủ công từng service

**Terminal 1 - Backend API:**
```bash
cd C:\Users\admin\Desktop\Gubgipati-main\Gubgipati-main
node local-server.js
```

**Terminal 2 - Printer Server:**
```bash
cd C:\Users\admin\Desktop\Gubgipati-main\Gubgipati-main\windows-printer-server
node printer-server.js
```

**Terminal 3 - React Webapp:**
```bash
cd C:\Users\admin\Desktop\Gubgipati-main\Gubgipati-main
npm start
```

---

## 🔍 KIỂM TRA HỆ THỐNG

### 1. Kiểm tra Backend API (Port 8000):
```
http://localhost:8000/health
→ Phải thấy: {"status":"OK"}
```

### 2. Kiểm tra Printer Server (Port 9977):
```
http://localhost:9977
→ Phải thấy: {"status":"running","service":"ESC/POS Printer Server"}
```

### 3. Kiểm tra React Webapp (Port 3000):
```
http://localhost:3000
→ Phải thấy trang login Gubgipati
```

---

## 🐛 TROUBLESHOOTING

### ❌ Vẫn lỗi "Login failed"

**Nguyên nhân có thể:**

1. **Backend API chưa chạy:**
   ```bash
   # Kiểm tra port 8000
   netstat -ano | findstr :8000
   
   # Nếu không có output = chưa chạy
   # Chạy: node local-server.js
   ```

2. **File .env thiếu hoặc sai:**
   ```bash
   # Kiểm tra file .env có tồn tại
   dir .env
   
   # Nếu không có, copy:
   copy local-env.txt .env
   ```

3. **Database Supabase không kết nối:**
   - Kiểm tra internet
   - Kiểm tra .env có đúng REACT_APP_SUPABASE_URL không

4. **User admin chưa tồn tại trong database:**
   - Cần chạy setup database:
   ```bash
   node setup-database.js
   ```

---

### ❌ Lỗi "Port already in use"

**Giải pháp:**
```
Double-click: KILL-PORTS-AUTO.bat
```

Hoặc:
```bash
# Kill port 8000
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8000') do taskkill /PID %a /F

# Kill port 3000
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F

# Kill port 9977
for /f "tokens=5" %a in ('netstat -ano ^| findstr :9977') do taskkill /PID %a /F
```

---

## 📊 SƠ ĐỒ HOẠT ĐỘNG LOGIN

```
Browser (localhost:3000)
    ↓ Nhập username/password
    ↓
React Webapp
    ↓ POST /auth/login
    ↓
Backend API (localhost:8000)
    ↓ Query database
    ↓
Supabase PostgreSQL
    ↓ Trả user data
    ↓
Backend API
    ↓ Return JWT token
    ↓
React Webapp
    ↓ Lưu token, chuyển trang
    ↓
Dashboard ✅
```

**Nếu thiếu Backend API → Lỗi ngay bước 3!**

---

## ✅ CHECKLIST HOÀN CHỈNH

Trước khi đăng nhập, đảm bảo:

- [ ] File `.env` đã tồn tại
- [ ] Backend API đang chạy (port 8000)
- [ ] Printer Server đang chạy (port 9977) - tùy chọn
- [ ] React Webapp đã compile xong (port 3000)
- [ ] Đã test http://localhost:8000/health → OK
- [ ] Đã vào http://localhost:3000 → Thấy trang login

**Sau đó mới đăng nhập:**
- Username: `admin`
- Password: `admin123`

---

## 🎯 TÓM TẮT NHANH

**Cách nhanh nhất để login thành công:**

1. Double-click: `START-FULL-WITH-BACKEND.bat`
2. Chờ 60-90 giây
3. Kiểm tra: http://localhost:8000/health
4. Vào: http://localhost:3000
5. Login: admin / admin123

**Xong!** 🎉

---

**Cập nhật:** 31/10/2025  
**Lần sửa cuối:** Fix lỗi ERR_CONNECTION_REFUSED khi login

