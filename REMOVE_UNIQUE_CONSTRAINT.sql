-- Script xóa unique constraint để cho phép nhiều dòng cùng order_id và buffet_package_id
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra constraints hiện tại
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.order_buffet'::regclass;

-- 2. Xóa unique constraint nếu có
ALTER TABLE public.order_buffet 
DROP CONSTRAINT IF EXISTS unique_order_buffet;

-- 3. Kiểm tra lại constraints sau khi xóa
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.order_buffet'::regclass;

-- 4. Test insert nhiều dòng cùng order_id và buffet_package_id
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
        -- Test insert nhiều dòng cùng order_id và buffet_package_id
        INSERT INTO public.order_buffet (order_id, buffet_package_id, quantity) 
        VALUES 
            (test_order_id, 35, 1),
            (test_order_id, 35, 2),
            (test_order_id, 35, 3)
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

-- 5. Thông báo hoàn thành
SELECT 'Unique constraint removed successfully!' as message;
