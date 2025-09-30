-- Script test insert nhiều dòng cùng order_id và buffet_package_id
-- Chạy script này trên Supabase SQL Editor để kiểm tra

-- 1. Lấy order_id gần nhất có buffet_package_id
SELECT 
    id as order_id,
    order_number,
    buffet_package_id,
    buffet_quantity
FROM public.orders 
WHERE buffet_package_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Test insert nhiều dòng cùng order_id và buffet_package_id
DO $$
DECLARE
    test_order_id INTEGER;
    test_package_id INTEGER;
BEGIN
    -- Lấy order_id và buffet_package_id gần nhất
    SELECT id, buffet_package_id 
    INTO test_order_id, test_package_id
    FROM public.orders 
    WHERE buffet_package_id IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_order_id IS NOT NULL AND test_package_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with order_id: %, buffet_package_id: %', test_order_id, test_package_id;
        
        -- Test insert nhiều dòng cùng order_id và buffet_package_id
        INSERT INTO public.order_buffet (order_id, buffet_package_id, quantity) 
        VALUES 
            (test_order_id, test_package_id, 1),
            (test_order_id, test_package_id, 2),
            (test_order_id, test_package_id, 3);
        
        -- Kiểm tra kết quả
        PERFORM COUNT(*) FROM public.order_buffet WHERE order_id = test_order_id;
        
        -- Hiển thị kết quả
        RAISE NOTICE 'Successfully inserted multiple rows for same order_id and buffet_package_id';
        
        -- Xóa dữ liệu test
        DELETE FROM public.order_buffet WHERE order_id = test_order_id AND buffet_package_id = test_package_id;
        
        RAISE NOTICE 'Test completed successfully!';
    ELSE
        RAISE NOTICE 'No orders found with buffet_package_id, skipping test';
    END IF;
END $$;

-- 3. Kiểm tra constraints hiện tại
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.order_buffet'::regclass;

-- 4. Thông báo hoàn thành
SELECT 'Multiple insert test completed!' as message;
