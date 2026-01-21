# 🖨️ HƯỚNG DẪN QUẢN LÝ MÁY IN

## 📋 Tổng Quan

Hệ thống hỗ trợ **3 máy in** với các loại kết nối khác nhau:

1. **QUAY BARR** - USB002 (USB) - XP-80C - Quầy Bar
2. **BEP THIT** - 192.168.1.236 (IP) - XP-80C - Bếp 1
3. **BEP NONG** - 192.168.1.235 (IP) - XP-80C - Bếp 2

## 🔧 Cấu Hình Máy In

### Danh Sách Máy In

| Tên | Loại | Kết Nối | Vị Trí |
|-----|------|---------|--------|
| QUAY BARR | USB | USB002 | Quầy Bar |
| BEP THIT | IP | 192.168.1.236:9100 | Bếp 1 |
| BEP NONG | IP | 192.168.1.235:9100 | Bếp 2 |

## 📝 Cập Nhật Danh Sách Máy In

### Cách 1: Chạy Script Batch (Khuyến nghị)

```bash
UPDATE-PRINTERS.bat
```

### Cách 2: Chạy Trực Tiếp

```bash
node update-printers-database.js
```

Script sẽ:
- ✅ Cập nhật hoặc thêm mới máy in vào database
- ✅ Hiển thị danh sách máy in hiện tại
- ✅ Kiểm tra trạng thái máy in

## 🚀 Khởi Động Printer Server

### Cách 1: Chạy Script Batch

```bash
START-PRINTER-SERVER.bat
```

### Cách 2: Chạy Thủ Công

```bash
cd windows-printer-server
node printer-server.js
```

### Cách 3: Khởi Động Toàn Bộ Hệ Thống

```bash
START-FINAL.bat
```

## 🔍 Kiểm Tra Printer Server

### Health Check

```bash
# Mở browser hoặc dùng curl
http://localhost:9977/health
```

### Lấy Danh Sách Máy In

```bash
# Mở browser hoặc dùng curl
http://localhost:9977/printers
```

## 📡 API Endpoints

### POST /print/image

Gửi lệnh in bill tới máy in.

**Request Body:**
```json
{
  "image_base64": "data:image/png;base64,...",
  "printer_name": "BEP THIT",
  "filename": "bill_123.png",
  "meta": {
    "table_name": "Bàn A5",
    "order_id": 123
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã in thành công tới BEP THIT (Bếp 1)",
  "printer": {
    "name": "BEP THIT",
    "location": "Bếp 1",
    "connection_type": "ip"
  },
  "elapsed_ms": 250
}
```

### GET /printers

Lấy danh sách máy in từ database.

**Response:**
```json
{
  "success": true,
  "printers": [
    {
      "id": 13,
      "name": "QUAY BARR",
      "connection_type": "usb",
      "usb_port": "USB002",
      "location": "Quầy Bar",
      "status": "active"
    },
    {
      "id": 14,
      "name": "BEP THIT",
      "connection_type": "ip",
      "ip_address": "192.168.1.236",
      "port_number": 9100,
      "location": "Bếp 1",
      "status": "active"
    },
    {
      "id": 15,
      "name": "BEP NONG",
      "connection_type": "ip",
      "ip_address": "192.168.1.235",
      "port_number": 9100,
      "location": "Bếp 2",
      "status": "active"
    }
  ]
}
```

## 🖨️ Cách Hoạt Động

### 1. Tự Động Chọn Máy In

Printer server sẽ tự động chọn máy in dựa trên:
- `printer_name` trong request (tìm theo tên hoặc location)
- Nếu không tìm thấy, dùng máy in đầu tiên trong danh sách

### 2. In Qua IP

- Kết nối TCP tới `ip_address:port_number`
- Gửi ESC/POS command trực tiếp
- Timeout: 15 giây

### 3. In Qua USB

- Sử dụng Windows printer port (USB002)
- Copy dữ liệu nhị phân tới printer port
- Yêu cầu máy in đã được cài đặt trên Windows

## ⚙️ Cấu Hình

### Thêm Máy In Mới

1. Sửa file `update-printers-database.js`
2. Thêm máy in vào mảng `printers`
3. Chạy script cập nhật:

```bash
node update-printers-database.js
```

### Sửa Thông Tin Máy In

1. Truy cập Supabase Dashboard
2. Vào bảng `printers`
3. Sửa thông tin máy in
4. Restart printer server để cập nhật cache

## 🐛 Troubleshooting

### ❌ Lỗi: "Không tìm thấy máy in"

**Nguyên nhân:** Máy in chưa được thêm vào database

**Giải pháp:**
```bash
# Chạy script cập nhật
UPDATE-PRINTERS.bat
```

### ❌ Lỗi: "Lỗi kết nối máy in IP"

**Nguyên nhân:** 
- Máy in chưa bật
- IP sai hoặc không cùng mạng
- Firewall chặn port 9100

**Giải pháp:**
1. Kiểm tra máy in đã bật chưa
2. Ping IP máy in: `ping 192.168.1.236`
3. Kiểm tra port: `telnet 192.168.1.236 9100`
4. Kiểm tra firewall

### ❌ Lỗi: "Không thể kết nối tới máy in USB"

**Nguyên nhân:**
- Máy in chưa được cài đặt trên Windows
- USB port sai
- Máy in chưa kết nối

**Giải pháp:**
1. Kiểm tra máy in trong Windows Settings > Printers
2. Đảm bảo máy in đã được cài đặt
3. Kiểm tra USB port trong Device Manager
4. Thử in test page từ Windows

### ❌ Lỗi: "Printer server không chạy"

**Giải pháp:**
```bash
# Khởi động printer server
START-PRINTER-SERVER.bat

# Hoặc
cd windows-printer-server
node printer-server.js
```

## 📌 Lưu Ý

1. **Cache:** Printer server cache danh sách máy in trong 1 phút
2. **USB Port:** Trên Windows, USB002 thường là Windows printer port
3. **IP Port:** Mặc định port 9100 cho máy in ESC/POS
4. **Timeout:** Timeout kết nối là 15 giây

## 🎉 Hoàn Tất!

Hệ thống đã sẵn sàng in bill tới 3 máy in:
- ✅ QUAY BARR (USB)
- ✅ BEP THIT (IP)
- ✅ BEP NONG (IP)

**Cập nhật:** 06/11/2025


















