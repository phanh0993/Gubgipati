-- Script đơn giản để tạo bảng order_buffet
-- Chạy script này trên Supabase SQL Editor

-- 1. Tạo bảng order_buffet nếu chưa có
CREATE TABLE IF NOT EXISTS public.order_buffet (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buffet_package_id INTEGER NOT NULL REFERENCES public.buffet_packages(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Tạo indexes
CREATE INDEX IF NOT EXISTS idx_order_buffet_order ON public.order_buffet(order_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_package ON public.order_buffet(buffet_package_id);

-- 3. Kiểm tra bảng đã tạo thành công
SELECT 'Order_buffet table created successfully!' as message;

-- 4. Kiểm tra cấu trúc bảng
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_buffet' 
ORDER BY ordinal_position;
