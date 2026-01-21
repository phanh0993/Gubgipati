# 🔧 KHẮC PHỤC LỖI IN

## ❌ Lỗi: `ERR_CONNECTION_REFUSED` hoặc `Failed to fetch`

**Nguyên nhân:** Printer server chưa được khởi động hoặc không chạy trên port 9000.

## ✅ Cách khắc phục:

### Cách 1: Khởi động chỉ Printer Server
1. Double-click vào file: **`START-PRINTER-SERVER.bat`**
2. Đợi cửa sổ hiển thị: `✅ Sẵn sàng nhận lệnh in!`
3. Giữ cửa sổ này mở

### Cách 2: Khởi động toàn bộ hệ thống (Khuyến nghị)
1. Double-click vào file: **`START-FINAL.bat`**
2. Hệ thống sẽ khởi động:
   - Backend API (port 8000)
   - Printer Server (port 9000) 
   - React Webapp (port 3000)
3. Giữ tất cả các cửa sổ mở

### Cách 3: Khởi động chạy ngầm (không hiện cửa sổ)
1. Double-click vào file: **`START-FINAL-HIDDEN.vbs`**
2. Hệ thống sẽ chạy ngầm
3. Kiểm tra log trong các file:
   - `printer-server.log` - Log của Printer Server
   - `system-startup.log` - Log khởi động hệ thống

## 🔍 Kiểm tra Printer Server đã chạy:

### Cách 1: Kiểm tra trong Browser
Mở trình duyệt và truy cập:
```
http://localhost:9000/health
```

Nếu thấy:
```json
{"status":"ok","timestamp":"..."}
```
→ Printer Server đã chạy ✅

Nếu thấy lỗi kết nối:
→ Printer Server chưa chạy ❌

### Cách 2: Kiểm tra bằng Command Prompt
Mở Command Prompt và chạy:
```batch
netstat -ano | findstr :9000
```

Nếu thấy kết quả:
```
TCP    0.0.0.0:9000    0.0.0.0:0    LISTENING    12345
```
→ Printer Server đã chạy ✅ (số 12345 là Process ID)

Nếu không thấy gì:
→ Printer Server chưa chạy ❌

## ⚠️ Lưu ý quan trọng:

1. **Phải giữ cửa sổ Printer Server mở** - Nếu đóng cửa sổ, printer server sẽ tắt
2. **Port 9000 phải trống** - Nếu port bị chiếm, script sẽ tự động kill process cũ
3. **Kiểm tra file .env** - Đảm bảo có cấu hình Supabase để lấy danh sách máy in

## 🚨 Nếu vẫn lỗi sau khi khởi động:

1. **Kiểm tra log:**
   - Xem cửa sổ Printer Server có lỗi gì không
   - Hoặc xem file `printer-server.log`

2. **Kiểm tra máy in:**
   - Đảm bảo máy in đã được cấu hình trong database
   - Vào trang **Quản lý máy in** để kiểm tra

3. **Khởi động lại:**
   - Đóng tất cả cửa sổ
   - Chạy lại `START-FINAL.bat`

## 📞 Thông tin liên hệ:

Nếu vẫn không giải quyết được, vui lòng:
- Chụp màn hình lỗi
- Chụp màn hình cửa sổ Printer Server
- Gửi file `printer-server.log` (nếu có)

---

**Chúc bạn khắc phục thành công! 🎉**






