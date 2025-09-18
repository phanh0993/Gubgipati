# 🏠 JULY SPA Management System - Local Development

## 🎯 Tổng Quan

Hệ thống quản lý spa toàn diện với:
- **Frontend**: React 19 + TypeScript + Material-UI
- **Backend**: Node.js + Express + PostgreSQL (Supabase)
- **Database**: Supabase PostgreSQL
- **Features**: POS, CRM, Payroll, Reports

## ⚡ Quick Start

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Environment
```bash
# Copy environment files
cp local-env.txt .env
cp server-env.txt server/.env
```

### 3. Khởi tạo Database
```bash
npm run setup
```

### 4. Chạy ứng dụng
```bash
# Windows
start-local.bat

# macOS/Linux
./start-local.sh

# Hoặc chạy thủ công
npm run dev
```

## 🌐 Truy Cập

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 🔑 Đăng Nhập Mặc Định

```
Username: admin
Password: admin123
```

## 📁 Cấu Trúc Dự Án

```
july-spa-management/
├── src/                    # Frontend React
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── api/                   # Vercel API (production)
├── server/                # Local backend
│   └── .env              # Backend environment
├── local-server.js        # Local Express server
├── setup-database.js      # Database setup script
├── .env                   # Frontend environment
├── package.json           # Dependencies & scripts
└── LOCAL_SETUP.md         # Detailed setup guide
```

## 🛠️ Scripts

```bash
# Development
npm run dev          # Chạy cả frontend + backend
npm run client       # Chỉ chạy frontend
npm run server       # Chỉ chạy backend

# Database
npm run setup        # Khởi tạo database

# Production
npm run build        # Build frontend
npm start           # Chạy production build
```

## 🎨 Tính Năng Chính

### 🏪 POS System
- Multi-tab interface
- Chọn dịch vụ và nhân viên
- Tính toán hoa hồng tự động
- Hỗ trợ giảm giá
- Thanh toán đa dạng

### 👥 Quản Lý Khách Hàng
- Thông tin chi tiết
- Lịch sử sử dụng dịch vụ
- Điểm tích lũy
- Tìm kiếm nhanh

### 👨‍💼 Quản Lý Nhân Viên
- Thông tin cá nhân
- Mã nhân viên, chức vụ
- Lương cơ bản và hoa hồng
- Quản lý tài khoản

### 💰 Tính Lương
- Lương cơ bản + hoa hồng + tăng ca
- Chi tiết hóa đơn đã thực hiện
- Quản lý giờ tăng ca
- Báo cáo tổng hợp

### 📊 Dashboard & Báo Cáo
- Thống kê tổng quan
- Biểu đồ doanh thu
- Phân tích hiệu suất
- Báo cáo theo thời gian

## 🔧 Cấu Hình Database

Database được lưu trữ trên Supabase với các bảng:

- `users` - Tài khoản đăng nhập
- `customers` - Thông tin khách hàng
- `employees` - Thông tin nhân viên
- `services` - Danh mục dịch vụ
- `invoices` - Hóa đơn
- `invoice_items` - Chi tiết hóa đơn
- `overtime_records` - Bản ghi tăng ca
- `appointments` - Lịch hẹn

## 🚨 Troubleshooting

### Lỗi Database Connection
```bash
# Kiểm tra kết nối
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.yydxhcvxkmxbohqtbbvw:Locphucanh0911@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(res => console.log('✅ Connected:', res.rows[0])).catch(err => console.error('❌ Error:', err));
"
```

### Lỗi Port đã sử dụng
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Lỗi Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tài Liệu Chi Tiết

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Hướng dẫn setup chi tiết
- [API Documentation](./api/) - Tài liệu API endpoints
- [Database Schema](./setup-database.js) - Cấu trúc database

## 🎉 Hoàn Thành!

Sau khi setup thành công, bạn có thể:
1. Truy cập http://localhost:3000
2. Đăng nhập với admin/admin123
3. Bắt đầu sử dụng hệ thống!

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy kiểm tra:
- Node.js version >= 16
- Database connection
- Environment variables
- Port availability
- Dependencies installation

