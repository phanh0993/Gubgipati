# 🏠 JULY SPA & Restaurant Management System

Hệ thống quản lý spa và nhà hàng toàn diện được xây dựng với React, Node.js và PostgreSQL.

## ✨ Tính Năng Chính

### 🏪 SPA Management System
- **Dashboard**: Thống kê tổng quan doanh thu và hoạt động
- **POS System**: Hệ thống bán hàng đa tab với tính toán hoa hồng tự động
- **Quản lý Khách hàng**: CRUD khách hàng, lịch sử sử dụng dịch vụ, điểm tích lũy
- **Quản lý Nhân viên**: Thông tin nhân viên, lương cơ bản, hoa hồng, tăng ca
- **Quản lý Dịch vụ**: Danh mục dịch vụ spa với giá và thời gian
- **Tính lương**: Tự động tính lương cơ bản + hoa hồng + tăng ca
- **Báo cáo**: Thống kê doanh thu, phân tích hiệu suất

### 🍽️ Restaurant Management System
- **Quản lý Bàn**: Drag & drop table layout, quản lý trạng thái bàn
- **Quản lý Thực đơn**: Món ăn, danh mục, giá cả, thời gian chế biến
- **Quản lý Kho**: Nguyên liệu, tồn kho, xuất nhập kho tự động
- **Công thức**: Quản lý công thức nấu ăn và định lượng nguyên liệu
- **POS Buffet**: Hệ thống buffet với gói dịch vụ và thời gian
- **Kitchen Display**: Màn hình bếp theo dõi đơn hàng
- **Quản lý Máy in**: Cấu hình máy in cho các khu vực khác nhau

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 19 + TypeScript + Material-UI
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Deployment**: Vercel

## 🚀 Cài Đặt và Chạy

### 1. Clone Repository
```bash
git clone https://github.com/phanh0993/Gubgipati.git
cd Gubgipati
```

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Environment
```bash
# Copy và chỉnh sửa file environment
cp env.production.example .env
```

### 4. Khởi Tạo Database
```bash
npm run setup
```

### 5. Chạy Development
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng biệt
npm run client  # Frontend: http://localhost:3000
npm run server  # Backend: http://localhost:8000
```

## 🌐 Deploy trên Vercel

### 1. Cài Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Cấu Hình Environment Variables trên Vercel
Thêm các biến môi trường sau trên Vercel Dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `REACT_APP_API_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 🔑 Đăng Nhập Mặc Định

```
Username: admin
Password: admin123
```

## 📁 Cấu Trúc Dự Án

```
gubgipati/
├── src/                    # Frontend React
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── api/                   # Vercel serverless functions
├── server/                # Local backend (development)
├── public/                # Static assets
├── build/                 # Production build
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies & scripts
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### SPA Management
- `GET /api/dashboard` - Dashboard data
- `GET/POST/PUT/DELETE /api/customers` - Quản lý khách hàng
- `GET/POST/PUT/DELETE /api/employees` - Quản lý nhân viên
- `GET/POST/PUT/DELETE /api/services` - Quản lý dịch vụ
- `GET/POST/PUT/DELETE /api/invoices` - Quản lý hóa đơn
- `GET/POST /api/payroll` - Tính lương

### Restaurant Management
- `GET/POST/PUT/DELETE /api/tables` - Quản lý bàn
- `GET/POST/PUT/DELETE /api/food-items` - Quản lý món ăn
- `GET/POST/PUT/DELETE /api/ingredients` - Quản lý nguyên liệu
- `GET/POST/PUT/DELETE /api/orders` - Quản lý đơn hàng
- `GET/POST/PUT/DELETE /api/buffet-packages` - Quản lý gói buffet

## 🗄️ Database Schema

### SPA Tables
- `users` - Tài khoản đăng nhập
- `customers` - Khách hàng
- `employees` - Nhân viên
- `services` - Dịch vụ spa
- `invoices` - Hóa đơn
- `invoice_items` - Chi tiết hóa đơn
- `overtime_records` - Bản ghi tăng ca
- `appointments` - Lịch hẹn

### Restaurant Tables
- `tables` - Bàn ăn
- `food_categories` - Danh mục món ăn
- `food_items` - Món ăn
- `ingredients` - Nguyên liệu
- `recipe_ingredients` - Công thức nấu ăn
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `buffet_packages` - Gói buffet
- `printers` - Máy in

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên Hệ

- GitHub: [@phanh0993](https://github.com/phanh0993)
- Project Link: [https://github.com/phanh0993/Gubgipati](https://github.com/phanh0993/Gubgipati)

## 🎉 Acknowledgments

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://postgresql.org/)
- [Supabase](https://supabase.com/)
- [Vercel](https://vercel.com/)