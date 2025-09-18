# 🚀 Hướng Dẫn Deploy JULY Management System

## 📋 Yêu Cầu Trước Khi Deploy

- Node.js 16+
- Account Vercel
- Account GitHub
- Database PostgreSQL (Supabase)

## 🌐 Deploy lên Vercel

### 1. Cài Đặt Vercel CLI
```bash
npm install -g vercel
```

### 2. Login Vercel
```bash
vercel login
```

### 3. Deploy
```bash
# Trong thư mục dự án
vercel --prod
```

### 4. Cấu Hình Environment Variables trên Vercel

Truy cập [Vercel Dashboard](https://vercel.com/dashboard) và thêm các biến môi trường sau:

#### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-app-name.vercel.app
REACT_APP_SUPABASE_URL=https://yydxhcvxkmxbohqtbbvw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDM3NjAsImV4cCI6MjA3MzU3OTc2MH0.rVZq_iqRTUAiAu_FH1Qk7XzWurM1XsMVlgwaUjXT6Kk
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs
```

#### Backend Environment Variables:
```
DATABASE_URL=postgresql://postgres.yydxhcvxkmxbohqtbbvw:Locphucanh0911@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=july-spa-secret-key-2024
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
SUPABASE_URL=https://yydxhcvxkmxbohqtbbvw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDM3NjAsImV4cCI6MjA3MzU3OTc2MH0.rVZq_iqRTUAiAu_FH1Qk7XzWurM1XsMVlgwaUjXT6Kk
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs
```

### 5. Kiểm Tra Deploy

Sau khi deploy thành công:
- Frontend: `https://your-app-name.vercel.app`
- API Health Check: `https://your-app-name.vercel.app/api/health`

## 🔧 Troubleshooting

### Lỗi Build
```bash
# Kiểm tra build local
npm run build
```

### Lỗi API
- Kiểm tra environment variables trên Vercel
- Kiểm tra database connection
- Xem logs trên Vercel Dashboard

### Lỗi CORS
- Đảm bảo `CORS_ORIGIN` trỏ đúng domain Vercel
- Cập nhật `REACT_APP_API_URL` trong frontend

## 📱 Truy Cập Sau Khi Deploy

1. Truy cập URL Vercel app
2. Đăng nhập:
   - Username: `admin`
   - Password: `admin123`

## 🔄 Auto Deploy từ GitHub

1. Connect repository với Vercel
2. Mỗi push lên main branch sẽ tự động deploy
3. Environment variables sẽ được giữ nguyên

## 🗄️ Database Setup

Database đã được cấu hình sẵn trên Supabase. Nếu cần setup lại:

```bash
# Chạy script setup database
node setup-database.js
node restaurant-database-setup.js
```

## 🎯 Features Có Sẵn Sau Deploy

- ✅ SPA Management System
- ✅ Restaurant Management System  
- ✅ POS System
- ✅ Mobile Interface
- ✅ Dashboard & Reports
- ✅ User Authentication
- ✅ Database Integration
