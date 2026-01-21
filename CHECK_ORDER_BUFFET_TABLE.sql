-- Script kiểm tra và tạo bảng order_buffet nếu chưa có
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra bảng order_buffet có tồn tại không
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'order_buffet'
) as table_exists;

-- 2. Nếu bảng chưa tồn tại, tạo bảng
CREATE TABLE IF NOT EXISTS public.order_buffet (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buffet_package_id INTEGER NOT NULL REFERENCES public.buffet_packages(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Tạo indexes
CREATE INDEX IF NOT EXISTS idx_order_buffet_order ON public.order_buffet(order_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_package ON public.order_buffet(buffet_package_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_quantity ON public.order_buffet(quantity);

-- 4. Kiểm tra cấu trúc bảng
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_buffet' 
ORDER BY ordinal_position;

-- 5. Test insert dữ liệu mẫu
DO $$
DECLARE
    test_order_id INTEGER;
BEGIN
    -- Lấy order_id đầu tiên có buffet_package_id
    SELECT id INTO test_order_id 
    FROM public.orders 
    WHERE buffet_package_id IS NOT NULL 
    LIMIT 1;
    
    IF test_order_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO public.order_buffet (order_id, buffet_package_id, quantity) 
        VALUES (test_order_id, 35, 1) 
        ON CONFLICT DO NOTHING;
        
        -- Kiểm tra dữ liệu
        PERFORM COUNT(*) FROM public.order_buffet WHERE order_id = test_order_id;
        
        -- Xóa dữ liệu test
        DELETE FROM public.order_buffet WHERE order_id = test_order_id AND buffet_package_id = 35;
        
        RAISE NOTICE 'Test completed successfully with order_id: %', test_order_id;
    ELSE
        RAISE NOTICE 'No orders found with buffet_package_id, skipping test';
    END IF;
END $$;

-- 6. Kiểm tra quyền truy cập
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'order_buffet' 
AND table_schema = 'public';

-- 7. Thông báo hoàn thành
SELECT 'Order_buffet table check completed!' as message;
