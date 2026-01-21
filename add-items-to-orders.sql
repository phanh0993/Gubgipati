-- Script để thêm cột items vào bảng orders
-- Copy và chạy trong Supabase SQL Editor

-- 1. Thêm cột items JSONB vào bảng orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- 2. Kiểm tra cấu trúc bảng
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 3. Kiểm tra dữ liệu hiện tại
SELECT id, order_number, items FROM orders LIMIT 5;
