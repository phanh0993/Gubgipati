-- Thêm cột driver vào bảng printers
-- File: ADD_DRIVER_COLUMN_TO_PRINTERS.sql
-- Mô tả: Thêm cột driver để lưu thông tin driver máy in

-- Kiểm tra xem cột driver đã tồn tại chưa
DO $$
BEGIN
    -- Thêm cột driver nếu chưa tồn tại
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'printers' 
        AND column_name = 'driver'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.printers 
        ADD COLUMN driver TEXT;
        
        -- Thêm comment cho cột
        COMMENT ON COLUMN public.printers.driver IS 'Driver máy in (VD: HP Universal Printing PS)';
        
        RAISE NOTICE 'Đã thêm cột driver vào bảng printers thành công';
    ELSE
        RAISE NOTICE 'Cột driver đã tồn tại trong bảng printers';
    END IF;
END $$;

-- Kiểm tra cấu trúc bảng sau khi thêm cột
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'printers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
