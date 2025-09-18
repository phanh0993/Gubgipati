# 🍽️ JULY Restaurant Management System

Hệ thống quản lý nhà hàng toàn diện với đầy đủ tính năng quản lý bàn, kho, món ăn và POS.

## ✨ Tính Năng Chính

### 🏪 Quản Lý Bàn
- **Kéo thả bàn** trên sơ đồ nhà hàng
- **Đặt tên và số bàn** tùy chỉnh
- **Theo dõi trạng thái** bàn (trống, có khách, đã đặt, dọn dẹp)
- **Quản lý sức chứa** từng bàn

### 📦 Quản Lý Kho
- **Theo dõi tồn kho** nguyên liệu
- **Xuất nhập kho** tự động
- **Cảnh báo sắp hết** hàng
- **Báo cáo tồn kho** chi tiết
- **Quản lý nhà cung cấp**

### 🍽️ Quản Lý Món Ăn
- **Phân loại món ăn**: Món chính, món phụ, combo, topping, đồ uống
- **Công thức nấu ăn** với định lượng nguyên liệu
- **Tính giá vốn** tự động
- **Quản lý thời gian** chế biến
- **Upload hình ảnh** món ăn

### 💰 POS System
- **Chọn bàn** trực quan
- **Thêm món ăn** vào đơn hàng
- **Gửi đơn hàng** đến bếp
- **Thanh toán** riêng biệt
- **In hóa đơn** tự động
- **Theo dõi trạng thái** đơn hàng

## 🚀 Cài Đặt và Khởi Động

### Yêu Cầu Hệ Thống
- Node.js 16+
- PostgreSQL (Supabase)
- Windows/macOS/Linux

### Khởi Động Nhanh
```bash
# Windows
start-restaurant.bat

# macOS/Linux
chmod +x start-restaurant.sh
./start-restaurant.sh
```

### Khởi Động Thủ Công
```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi tạo database
node restaurant-database-setup.js

# 3. Khởi động server
node restaurant-api-server.js

# 4. Khởi động frontend (terminal mới)
npm run client
```

## 🌐 Truy Cập Hệ Thống

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Restaurant POS**: http://localhost:3000/restaurant-pos

### Đăng Nhập Mặc Định
```
Username: admin
Password: admin123
```

## 📊 Cấu Trúc Database

### Bảng Chính
- `tables` - Quản lý bàn
- `food_categories` - Danh mục món ăn
- `food_items` - Món ăn
- `ingredients` - Nguyên liệu
- `recipe_ingredients` - Công thức nấu ăn
- `inventory_transactions` - Giao dịch kho
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `kitchen_orders` - Đơn hàng bếp

## 🔧 API Endpoints

### Quản Lý Bàn
- `GET /api/tables` - Lấy danh sách bàn
- `POST /api/tables` - Tạo bàn mới
- `PUT /api/tables/:id` - Cập nhật bàn
- `DELETE /api/tables/:id` - Xóa bàn

### Quản Lý Kho
- `GET /api/ingredients` - Lấy danh sách nguyên liệu
- `POST /api/ingredients` - Thêm nguyên liệu
- `PUT /api/ingredients/:id` - Cập nhật nguyên liệu
- `POST /api/inventory-transactions` - Giao dịch kho

### Quản Lý Món Ăn
- `GET /api/food-items` - Lấy danh sách món ăn
- `POST /api/food-items` - Thêm món ăn
- `PUT /api/food-items/:id` - Cập nhật món ăn
- `GET /api/recipe-ingredients` - Lấy công thức
- `POST /api/recipe-ingredients` - Thêm công thức

### POS System
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id` - Cập nhật đơn hàng

## 🎯 Quy Trình Làm Việc

### 1. Thiết Lập Ban Đầu
1. **Tạo bàn** trong Quản Lý Bàn
2. **Thêm nguyên liệu** vào kho
3. **Tạo món ăn** và công thức
4. **Thiết lập danh mục** món ăn

### 2. Vận Hành Hàng Ngày
1. **Mở Restaurant POS**
2. **Chọn bàn** có khách
3. **Thêm món ăn** vào đơn hàng
4. **Gửi đơn hàng** đến bếp
5. **Thanh toán** khi khách ăn xong

### 3. Quản Lý Kho
1. **Nhập kho** nguyên liệu mới
2. **Theo dõi tồn kho** hàng ngày
3. **Xuất kho** khi chế biến món ăn
4. **Báo cáo** tồn kho cuối ngày

## 🔄 Tích Hợp Hệ Thống

### Tự Động Trừ Kho
- Khi tạo đơn hàng, hệ thống tự động trừ nguyên liệu theo công thức
- Cảnh báo khi không đủ nguyên liệu
- Theo dõi lịch sử xuất kho

### Báo Cáo Tự Động
- Báo cáo doanh thu theo ngày/tuần/tháng
- Báo cáo tồn kho và chi phí nguyên liệu
- Thống kê món ăn bán chạy

## 🛠️ Tùy Chỉnh

### Thêm Loại Món Ăn Mới
1. Vào Quản Lý Món Ăn
2. Chọn "Thêm Món Ăn"
3. Chọn loại món ăn phù hợp
4. Thiết lập công thức và giá

### Cấu Hình Bàn
1. Vào Quản Lý Bàn
2. Kéo thả bàn trên sơ đồ
3. Đặt tên và sức chứa
4. Lưu cấu hình

## 📱 Responsive Design

Hệ thống được thiết kế responsive, hoạt động tốt trên:
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

## 🔒 Bảo Mật

- JWT Authentication
- Role-based Access Control
- CORS Protection
- Input Validation
- SQL Injection Prevention

## 📈 Hiệu Suất

- Database Indexing
- Lazy Loading
- Image Optimization
- Caching Strategy
- Connection Pooling

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Database connection
2. Environment variables
3. Port availability (3000, 8000)
4. Node.js version (16+)

## 🎉 Kết Luận

JULY Restaurant Management System cung cấp giải pháp toàn diện cho việc quản lý nhà hàng, từ quản lý bàn, kho, món ăn đến POS system. Hệ thống được thiết kế đơn giản, dễ sử dụng và có thể tùy chỉnh theo nhu cầu của từng nhà hàng.

**Chúc bạn sử dụng hệ thống hiệu quả! 🍽️✨**

