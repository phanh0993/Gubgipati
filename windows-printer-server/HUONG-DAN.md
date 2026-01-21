# 🖨️ ESC/POS PRINTER SERVER - HƯỚNG DẪN SỬ DỤNG

## 📋 Mô tả
Server in bill dùng ESC/POS bitmap qua TCP/IP cho máy in POS-80C.

---

## ⚙️ YÊU CẦU HỆ THỐNG
- Windows 10/11
- Máy in POS-80C kết nối mạng: **IP 192.168.0.3**, Port **9100**
- Node.js v18+ (nếu chạy bằng source code)

---

## 🚀 CÁCH CHẠY

### Phương án 1: Chạy file .exe (Đơn giản nhất)
1. Double-click file **`printer-server.exe`**
2. Server sẽ khởi động tại `http://localhost:9977`
3. Xem console để theo dõi log in

### Phương án 2: Chạy bằng Node.js
```bash
# Cài dependencies (chỉ lần đầu)
npm install

# Khởi động server
npm start

# Hoặc dùng file bat
start-server.bat
```

---

## 📡 ENDPOINT API

### POST `/print/image`
**Mục đích:** Nhận ảnh PNG base64, convert sang ESC/POS, gửi tới máy in

**Request Body:**
```json
{
  "image_base64": "data:image/png;base64,iVBORw0KG...",
  "printer_name": "POS-80C",
  "filename": "bill_123.png",
  "meta": {
    "tableName": "Bàn 11",
    "zoneName": "Khu A",
    "staffName": "Lộc Phúc Anh"
  }
}
```

**Response (Thành công):**
```json
{
  "success": true,
  "message": "Đã in thành công tới POS-80C (192.168.0.3:9100)",
  "elapsed_ms": 234
}
```

**Response (Lỗi):**
```json
{
  "success": false,
  "message": "Lỗi kết nối máy in: ECONNREFUSED"
}
```

---

## 🔧 TROUBLESHOOTING

### ❌ Lỗi: "ECONNREFUSED" hoặc không in được
**Nguyên nhân:**
- Máy in không bật hoặc không kết nối mạng
- IP máy in sai (phải là 192.168.0.3)
- Firewall chặn port 9100

**Giải pháp:**
1. Kiểm tra máy in đã bật và kết nối mạng
2. Ping máy in: `ping 192.168.0.3`
3. Kiểm tra máy in có đúng IP không (xem trên màn hình máy in hoặc in config)
4. Tắt firewall tạm thời để test

### ❌ Lỗi: "Timeout kết nối máy in (15s)"
**Nguyên nhân:**
- Máy in không phản hồi (treo, không giấy...)
- Mạng chậm hoặc không ổn định

**Giải pháp:**
1. Khởi động lại máy in
2. Kiểm tra giấy in
3. Thử in test trực tiếp từ máy in

### ❌ Lỗi: Port 9977 đã được sử dụng
**Giải pháp:**
1. Tắt server cũ đang chạy
2. Hoặc sửa port trong file `printer-server.js` (dòng 10)

### ❌ In ra giấy trắng hoặc lỗi font
**Nguyên nhân:**
- Ảnh bill quá to hoặc quá nhỏ
- Định dạng ảnh sai

**Giải pháp:**
1. Kiểm tra ảnh bill có đúng 576px width không (80mm)
2. Xem file debug PNG được lưu trong thư mục server
3. Thử giảm brightness threshold (dòng 47 trong code)

---

## 📝 LOG & DEBUG

Server sẽ tự động:
- Hiển thị log chi tiết trên console
- Lưu file PNG debug với tên như: `bill_1234567890.png`
- Log thời gian xử lý (ms)

**Ví dụ log thành công:**
```
=== [PRINTER SERVER] Nhận request in bill ===
📄 Thông tin bill: { printer_name: 'POS-80C', filename: 'bill_123.png', ... }
✅ Đã decode PNG buffer: 45678 bytes
💾 Đã lưu file debug: bill_123.png
🔄 Đang convert PNG sang ESC/POS bitmap...
✅ Convert xong: 87654 bytes ESC/POS command
🖨️  Kết nối tới máy in 192.168.0.3:9100...
✅ Đã kết nối tới máy in
📤 Đang gửi 87654 bytes tới máy in...
✅ Hoàn tất in bill (234ms)
```

---

## 🔨 BUILD FILE .EXE

Nếu cần build lại file .exe:

```bash
# Cài pkg global
npm install -g pkg

# Build
npm run build

# File output: printer-server.exe
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra log trên console
2. Kiểm tra file PNG debug
3. Test ping máy in
4. Liên hệ developer với thông tin log đầy đủ

---

## 📌 LƯU Ý QUAN TRỌNG

⚠️ **Máy in phải cấu hình đúng IP: 192.168.0.3**  
⚠️ **Port máy in: 9100 (mặc định ESC/POS)**  
⚠️ **Ảnh bill nên 576px width (80mm) để in đẹp nhất**  
⚠️ **Server phải chạy cùng máy với webapp (localhost)**  

---

✅ **Server sẵn sàng phục vụ!**

