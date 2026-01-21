-- Script tổng hợp sửa timezone cho TẤT CẢ dữ liệu
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại
SELECT 
    'BEFORE FIX - Current data' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 2. Cấu hình timezone cho session
SET timezone = 'Asia/Ho_Chi_Minh';

-- 3. Sửa tất cả orders có buffet_start_time đúng nhưng created_at, updated_at sai
UPDATE public.orders 
SET 
    created_at = buffet_start_time,
    updated_at = buffet_start_time
WHERE 
    buffet_start_time IS NOT NULL
    AND (
        EXTRACT(HOUR FROM created_at) != EXTRACT(HOUR FROM buffet_start_time) 
        OR EXTRACT(HOUR FROM updated_at) != EXTRACT(HOUR FROM buffet_start_time)
    );

-- 4. Sửa các orders không có buffet_start_time
-- Thêm 7 giờ cho created_at và updated_at
UPDATE public.orders 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    buffet_start_time IS NULL
    AND created_at IS NOT NULL 
    AND updated_at IS NOT NULL;

-- 5. Cập nhật buffet_start_time cho các orders không có
UPDATE public.orders 
SET buffet_start_time = created_at
WHERE buffet_start_time IS NULL 
AND created_at IS NOT NULL;

-- 6. Sửa tất cả bảng khác
-- order_items
UPDATE public.order_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- order_buffet
UPDATE public.order_buffet 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- invoices
UPDATE public.invoices 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- invoice_items
UPDATE public.invoice_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- tables
UPDATE public.tables 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- employees
UPDATE public.employees 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- customers
UPDATE public.customers 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- buffet_packages
UPDATE public.buffet_packages 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- food_items
UPDATE public.food_items 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at < '2024-01-01 00:00:00+07' OR updated_at < '2024-01-01 00:00:00+07')
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- 7. Kiểm tra kết quả sau khi sửa
SELECT 
    'AFTER FIX - All timestamps should match' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 8. Kiểm tra timezone consistency
SELECT 
    'Timezone consistency check' as info,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM buffet_start_time) THEN 1 END) as matching_created,
    COUNT(CASE WHEN EXTRACT(HOUR FROM updated_at) = EXTRACT(HOUR FROM buffet_start_time) THEN 1 END) as matching_updated,
    COUNT(CASE WHEN EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM updated_at) THEN 1 END) as matching_created_updated
FROM public.orders
WHERE created_at IS NOT NULL 
AND updated_at IS NOT NULL 
AND buffet_start_time IS NOT NULL;

-- 9. Hiển thị thời gian hiện tại để so sánh
SELECT 
    'Current time check' as info,
    NOW() as postgres_now,
    NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vietnam_time,
    EXTRACT(TIMEZONE FROM NOW()) as timezone_offset;

-- 10. Thông báo hoàn thành
SELECT 'All timestamps updated to +7 UTC (Vietnam timezone)!' as message;
