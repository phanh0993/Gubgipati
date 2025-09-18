// Script đơn giản để thêm cột items vào bảng orders
// Chạy trực tiếp trên Supabase SQL Editor

console.log(`
-- Thêm cột items vào bảng orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Cập nhật dữ liệu hiện tại từ order_items sang cột items
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

-- Kiểm tra kết quả
SELECT id, order_number, items FROM orders LIMIT 5;
`);

console.log('✅ Copy script trên và chạy trong Supabase SQL Editor');
