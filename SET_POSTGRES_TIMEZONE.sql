-- Script cấu hình timezone cho PostgreSQL về +7 UTC (Giờ Hà Nội)
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra timezone hiện tại
SELECT 
    'Current timezone' as info,
    current_setting('timezone') as timezone,
    now() as current_time,
    now() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vietnam_time;

-- 2. Cấu hình timezone cho session hiện tại
SET timezone = 'Asia/Ho_Chi_Minh';

-- 3. Kiểm tra timezone sau khi cấu hình
SELECT 
    'After setting timezone' as info,
    current_setting('timezone') as timezone,
    now() as current_time,
    now() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vietnam_time;

-- 4. Tạo function để lấy thời gian Việt Nam
CREATE OR REPLACE FUNCTION get_vietnam_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh';
END;
$$ LANGUAGE plpgsql;

-- 5. Test function
SELECT 
    'Vietnam time function' as info,
    get_vietnam_time() as vietnam_time,
    NOW() as utc_time;

-- 6. Cập nhật tất cả các bảng để sử dụng timezone Việt Nam
-- Lưu ý: Chỉ chạy nếu muốn cập nhật tất cả dữ liệu hiện có
-- UPDATE public.orders 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh',
--     buffet_start_time = buffet_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
-- WHERE created_at IS NOT NULL;

-- 7. Thông báo hoàn thành
SELECT 'PostgreSQL timezone configured to Asia/Ho_Chi_Minh (+7 UTC)' as message;
