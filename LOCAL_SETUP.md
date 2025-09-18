# 🏠 Hướng Dẫn Chạy Dự Án Local - JULY SPA Management System

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: v16+ (khuyến nghị v18+)
- **npm**: v8+
- **Database**: Supabase PostgreSQL (đã cấu hình)
- **OS**: Windows, macOS, hoặc Linux

## 🚀 Các Bước Setup

### 1. Cài Đặt Dependencies

```bash
# Cài đặt tất cả packages
npm install

# Hoặc nếu có lỗi, thử:
npm install --legacy-peer-deps
```

### 2. Cấu Hình Environment Variables

#### Frontend (.env)
Tạo file `.env` trong thư mục gốc và copy nội dung từ `local-env.txt`:

```bash
# Copy nội dung từ local-env.txt vào .env
cp local-env.txt .env
```

Nội dung file `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://yydxhcvxkmxbohqtbbvw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDM3NjAsImV4cCI6MjA3MzU3OTc2MH0.rVZq_iqRTUAiAu_FH1Qk7XzWurM1XsMVlgwaUjXT6Kk
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs
```

#### Backend (.env)
Tạo file `.env` trong thư mục `server/` và copy nội dung từ `server-env.txt`:

```bash
# Tạo thư mục server nếu chưa có
mkdir -p server

# Copy nội dung từ server-env.txt vào server/.env
cp server-env.txt server/.env
```

### 3. Khởi Tạo Database

```bash
# Chạy script setup database
npm run setup
```

Script này sẽ:
- Tạo tất cả bảng cần thiết
- Thêm admin user mặc định
- Thêm dữ liệu mẫu
- Tạo indexes cho performance

### 4. Chạy Dự Án

#### Cách 1: Chạy đồng thời Frontend + Backend
```bash
npm run dev
```

#### Cách 2: Chạy riêng biệt

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

## 🌐 Truy Cập Ứng Dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 🔑 Thông Tin Đăng Nhập Mặc Định

```
Username: admin
Password: admin123
```

## 📁 Cấu Trúc Dự Án Local

```
july-spa-management/
├── src/                    # Frontend React
├── api/                    # Vercel API functions (không dùng khi chạy local)
├── server/                 # Backend local (tạo mới)
│   └── .env               # Backend environment variables
├── local-server.js        # Server local chính
├── setup-database.js      # Script khởi tạo database
├── .env                   # Frontend environment variables
├── package.json           # Dependencies và scripts
└── LOCAL_SETUP.md         # File hướng dẫn này
```

## 🛠️ Scripts Có Sẵn

```bash
# Chạy đồng thời frontend + backend
npm run dev

# Chỉ chạy backend
npm run server

# Chỉ chạy frontend
npm run client

# Khởi tạo database
npm run setup

# Build production
npm run build

# Chạy tests
npm run test
```

## 🔧 Troubleshooting

### Lỗi Database Connection
```bash
# Kiểm tra kết nối database
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.yydxhcvxkmxbohqtbbvw:Locphucanh0911@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(res => console.log('✅ Database connected:', res.rows[0])).catch(err => console.error('❌ Database error:', err));
"
```

### Lỗi Port đã được sử dụng
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong `server/.env`
- Đảm bảo frontend chạy trên port 3000

### Lỗi Module không tìm thấy
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📊 Database Schema

Dự án sử dụng các bảng chính:
- `users` - Tài khoản đăng nhập
- `customers` - Thông tin khách hàng
- `employees` - Thông tin nhân viên
- `services` - Danh mục dịch vụ
- `invoices` - Hóa đơn
- `invoice_items` - Chi tiết hóa đơn
- `overtime_records` - Bản ghi tăng ca
- `appointments` - Lịch hẹn

## 🎯 Tính Năng Chính

- ✅ **Dashboard**: Thống kê tổng quan
- ✅ **POS System**: Tạo hóa đơn multi-tab
- ✅ **Quản lý Khách hàng**: CRUD khách hàng
- ✅ **Quản lý Nhân viên**: CRUD nhân viên
- ✅ **Quản lý Dịch vụ**: CRUD dịch vụ spa
- ✅ **Quản lý Hóa đơn**: Xem, chỉnh sửa hóa đơn
- ✅ **Tính lương**: Quản lý lương và tăng ca
- ✅ **Báo cáo**: Thống kê doanh thu

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Node.js version >= 16
2. Database connection string đúng
3. Environment variables đã được set
4. Ports 3000 và 8000 không bị chiếm dụng
5. Dependencies đã được cài đặt đầy đủ

## 🎉 Hoàn Thành!

Sau khi setup thành công, bạn có thể:
- Truy cập http://localhost:3000
- Đăng nhập với admin/admin123
- Bắt đầu sử dụng hệ thống quản lý spa!

