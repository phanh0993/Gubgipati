-- Script sửa timezone cho tất cả cột thời gian về +7 UTC (Giờ Hà Nội)
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại
SELECT 
    'created_at' as column_name,
    MIN(created_at) as min_time,
    MAX(created_at) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE created_at IS NOT NULL

UNION ALL

SELECT 
    'updated_at' as column_name,
    MIN(updated_at) as min_time,
    MAX(updated_at) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE updated_at IS NOT NULL

UNION ALL

SELECT 
    'buffet_start_time' as column_name,
    MIN(buffet_start_time) as min_time,
    MAX(buffet_start_time) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE buffet_start_time IS NOT NULL;

-- 2. Cập nhật created_at: thêm 7 giờ nếu thời gian hiện tại < 2024-01-01 (giả định dữ liệu cũ chưa có timezone)
UPDATE public.orders 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- 3. Cập nhật updated_at: thêm 7 giờ nếu thời gian hiện tại < 2024-01-01
UPDATE public.orders 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 4. Cập nhật buffet_start_time: thêm 7 giờ nếu thời gian hiện tại < 2024-01-01
UPDATE public.orders 
SET buffet_start_time = buffet_start_time + INTERVAL '7 hours'
WHERE buffet_start_time < '2024-01-01 00:00:00+07'
AND buffet_start_time IS NOT NULL;

-- 5. Kiểm tra kết quả sau khi cập nhật
SELECT 
    'After Update - created_at' as column_name,
    MIN(created_at) as min_time,
    MAX(created_at) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE created_at IS NOT NULL

UNION ALL

SELECT 
    'After Update - updated_at' as column_name,
    MIN(updated_at) as min_time,
    MAX(updated_at) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE updated_at IS NOT NULL

UNION ALL

SELECT 
    'After Update - buffet_start_time' as column_name,
    MIN(buffet_start_time) as min_time,
    MAX(buffet_start_time) as max_time,
    COUNT(*) as total_rows
FROM public.orders
WHERE buffet_start_time IS NOT NULL;

-- 6. Hiển thị một vài dòng mẫu để kiểm tra
SELECT 
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 7. Thông báo hoàn thành
SELECT 'Timezone update completed! All timestamps are now in +7 UTC (Vietnam timezone)' as message;
