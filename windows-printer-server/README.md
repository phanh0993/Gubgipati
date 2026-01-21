# Windows Printer Server

Ứng dụng Windows để quét và in máy in thực tế cho hệ thống POS.

## Tính năng

- 🔍 **Quét máy in Windows** - Tự động tìm tất cả máy in đã cài đặt
- 🖨️ **Test in** - Kiểm tra máy in hoạt động
- 🍳 **In order bếp** - In đơn hàng cho bếp
- 🧾 **In hóa đơn** - In hóa đơn thanh toán
- ⚡ **API REST** - Giao tiếp với web app

## Cài đặt

### Cách 1: Chạy từ source code
```bash
# Cài đặt dependencies
npm install

# Chạy server
npm start
```

### Cách 2: Sử dụng file exe (khuyến nghị)
1. Tải file `printer-server.exe`
2. Chạy file exe
3. Server sẽ chạy trên port 9977

## Sử dụng

### 1. Khởi động server
```bash
# Chạy từ source
npm start

# Hoặc chạy file exe
./printer-server.exe
```

### 2. Kiểm tra server hoạt động
Mở trình duyệt: http://localhost:9977/health

### 3. Cấu hình web app
Trong web app, cấu hình:
- **Printer Agent URL:** `http://localhost:9977`
- **Environment Variable:** `REACT_APP_PRINTER_AGENT_URL=http://localhost:9977`

## API Endpoints

### Quét máy in
```http
POST http://localhost:9977/printers/scan
```

### Test in
```http
POST http://localhost:9977/printers/test
Content-Type: application/json

{
  "printer_name": "HP LaserJet Pro M404n",
  "content": "Test in - Máy in hoạt động bình thường"
}
```

### In order bếp
```http
POST http://localhost:9977/print/kitchen
Content-Type: application/json

{
  "printer_name": "HP LaserJet Pro M404n",
  "order": {
    "id": 123,
    "order_number": "ORD-001",
    "table_name": "Bàn 1"
  },
  "items": [
    {
      "name": "Phở bò",
      "quantity": 2,
      "special_instructions": "Không hành"
    }
  ]
}
```

### In hóa đơn
```http
POST http://localhost:9977/print/invoice
Content-Type: application/json

{
  "printer_name": "HP LaserJet Pro M404n",
  "order": {
    "id": 123,
    "order_number": "ORD-001",
    "table_name": "Bàn 1"
  },
  "items": [
    {
      "name": "Phở bò",
      "quantity": 2,
      "price": 50000,
      "total_price": 100000
    }
  ]
}
```

## Build exe

```bash
# Build cho Windows
npm run build

# Build cho tất cả platform
npm run build-all
```

## Yêu cầu hệ thống

- Windows 10/11
- Node.js 18+ (nếu chạy từ source)
- Máy in đã cài đặt driver
- PowerShell (có sẵn trên Windows)

## Troubleshooting

### Lỗi "PowerShell not found"
- Đảm bảo PowerShell đã được cài đặt
- Chạy với quyền Administrator

### Lỗi "Printer not found"
- Kiểm tra máy in đã được cài đặt
- Kiểm tra driver máy in
- Chạy lại quét máy in

### Lỗi "Access denied"
- Chạy ứng dụng với quyền Administrator
- Kiểm tra firewall settings

## Support

Liên hệ: July Restaurant Team
Version: 1.0.0
