# Hướng dẫn triển khai tính năng Note cho món ăn

## Tổng quan
Tính năng này cho phép thêm ghi chú (note) cho từng món ăn trong đơn hàng, và hiển thị ghi chú này trong chi tiết hóa đơn.

## Các bước triển khai

### 1. Cập nhật Database
Chạy file SQL để thêm cột `note` vào bảng `order_items`:
```sql
-- Chạy file: ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql
```

### 2. Cập nhật API
- File `restaurant-api-server.js` đã được cập nhật để:
  - Sử dụng cột `note` thay vì `special_instructions` khi tạo order_items
  - Bao gồm `note` trong các query SELECT
  - Trả về `note` trong response

### 3. Cập nhật Frontend
- File `SimpleRestaurantPOS.tsx` đã được cập nhật để:
  - Thêm trường `note` vào interface `OrderItem`
  - Hiển thị trường nhập note cho mỗi món trong giỏ hàng
  - Thêm hàm `handleUpdateItemNote` để xử lý cập nhật note
  - Gửi note khi tạo order

- File `MobileBillPage.tsx` đã được cập nhật để:
  - Hiển thị note trong chi tiết hóa đơn
  - Bao gồm note khi tạo order buffet

### 4. Cách sử dụng

#### Trên giao diện POS:
1. Thêm món vào giỏ hàng
2. Trong giỏ hàng, mỗi món sẽ có trường "Ghi chú cho món này..."
3. Nhập ghi chú nếu cần
4. Ghi chú sẽ được lưu vào database khi tạo order

#### Trong chi tiết hóa đơn:
1. Khi xem chi tiết hóa đơn, ghi chú sẽ hiển thị dưới tên món
2. Format: "Ghi chú: [nội dung ghi chú]"

## Cấu trúc Database

### Bảng order_items
```sql
ALTER TABLE public.order_items 
ADD COLUMN note TEXT;
```

### Các trường liên quan:
- `note`: Ghi chú cho món ăn (TEXT, nullable)
- `special_instructions`: Vẫn được giữ để tương thích ngược

## API Changes

### POST /api/orders
Request body bao gồm:
```json
{
  "items": [
    {
      "food_item_id": 1,
      "name": "Tên món",
      "price": 100000,
      "quantity": 2,
      "note": "Ghi chú đặc biệt"
    }
  ]
}
```

### Response
```json
{
  "items": [
    {
      "food_item_id": 1,
      "name": "Tên món",
      "price": 100000,
      "quantity": 2,
      "special_instructions": null,
      "note": "Ghi chú đặc biệt"
    }
  ]
}
```

## Lưu ý
- Tính năng tương thích ngược với dữ liệu cũ
- Nếu không có note, trường sẽ là null
- Ghi chú hiển thị trong cả giao diện PC và mobile
- Cần chạy SQL script trước khi sử dụng tính năng
