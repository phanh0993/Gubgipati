-- Script để sửa bảng orders trong Supabase
-- Copy và chạy trong Supabase SQL Editor

-- 1. Thêm cột items vào bảng orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- 2. Cập nhật dữ liệu hiện tại từ order_items sang cột items
UPDATE orders 
SET items = (
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'food_item_id', oi.food_item_id,
        'name', oi.service_name,
        'quantity', oi.quantity,
        'price', oi.unit_price,
        'total', oi.total_price
      )
    ), 
    '[]'::json
  )
  FROM order_items oi 
  WHERE oi.order_id = orders.id
);

-- 3. Kiểm tra kết quả
SELECT id, order_number, items FROM orders LIMIT 5;

-- 4. Kiểm tra cấu trúc bảng
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
