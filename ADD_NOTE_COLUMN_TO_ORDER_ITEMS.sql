-- Thêm cột note vào bảng order_items
-- File: ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql
-- Mô tả: Thêm cột note để lưu trữ ghi chú cho từng món ăn trong đơn hàng

-- Kiểm tra xem cột note đã tồn tại chưa
DO $$
BEGIN
    -- Thêm cột note nếu chưa tồn tại
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'note'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN note TEXT;
        
        -- Thêm comment cho cột
        COMMENT ON COLUMN public.order_items.note IS 'Ghi chú đặc biệt cho món ăn trong đơn hàng';
        
        RAISE NOTICE 'Đã thêm cột note vào bảng order_items thành công';
    ELSE
        RAISE NOTICE 'Cột note đã tồn tại trong bảng order_items';
    END IF;
END $$;

-- Kiểm tra cấu trúc bảng sau khi thêm cột
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
