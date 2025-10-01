-- Script sửa timezone cho các order hiện tại
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại
SELECT 
    'Current data check' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 2. Cập nhật tất cả orders có created_at và updated_at khác với buffet_start_time
-- (Giả định buffet_start_time đã đúng timezone +7)
UPDATE public.orders 
SET 
    created_at = buffet_start_time - INTERVAL '0 minutes',
    updated_at = buffet_start_time - INTERVAL '0 minutes'
WHERE 
    created_at IS NOT NULL 
    AND updated_at IS NOT NULL 
    AND buffet_start_time IS NOT NULL
    AND (
        EXTRACT(HOUR FROM created_at) != EXTRACT(HOUR FROM buffet_start_time) 
        OR EXTRACT(HOUR FROM updated_at) != EXTRACT(HOUR FROM buffet_start_time)
    );

-- 3. Cập nhật các orders không có buffet_start_time
-- Thêm 7 giờ cho created_at và updated_at
UPDATE public.orders 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    buffet_start_time IS NULL
    AND created_at IS NOT NULL 
    AND updated_at IS NOT NULL;

-- 4. Cập nhật buffet_start_time cho các orders không có
UPDATE public.orders 
SET buffet_start_time = created_at
WHERE buffet_start_time IS NULL 
AND created_at IS NOT NULL;

-- 5. Kiểm tra kết quả sau khi cập nhật
SELECT 
    'After update - All timestamps should match' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 6. Kiểm tra timezone consistency
SELECT 
    'Timezone consistency check' as info,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM buffet_start_time) THEN 1 END) as matching_created,
    COUNT(CASE WHEN EXTRACT(HOUR FROM updated_at) = EXTRACT(HOUR FROM buffet_start_time) THEN 1 END) as matching_updated
FROM public.orders
WHERE created_at IS NOT NULL 
AND updated_at IS NOT NULL 
AND buffet_start_time IS NOT NULL;

-- 7. Thông báo hoàn thành
SELECT 'All order timestamps updated to match +7 UTC timezone!' as message;
