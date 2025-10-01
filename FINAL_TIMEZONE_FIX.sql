-- Script cuối cùng sửa timezone cho TẤT CẢ dữ liệu
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại
SELECT 
    'BEFORE FIX - Current orders' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 3;

-- 2. Cấu hình timezone cho session
SET timezone = 'Asia/Ho_Chi_Minh';

-- 3. Sửa tất cả orders: đồng bộ created_at, updated_at với buffet_start_time
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

-- 4. Sửa orders không có buffet_start_time: thêm 7 giờ
UPDATE public.orders 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    buffet_start_time IS NULL
    AND created_at IS NOT NULL 
    AND updated_at IS NOT NULL;

-- 5. Cập nhật buffet_start_time cho orders không có
UPDATE public.orders 
SET buffet_start_time = created_at
WHERE buffet_start_time IS NULL 
AND created_at IS NOT NULL;

-- 6. Sửa tất cả invoices: thêm 7 giờ
UPDATE public.invoices 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    created_at IS NOT NULL 
    AND updated_at IS NOT NULL;

-- 7. Sửa invoice_items
UPDATE public.invoice_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at IS NOT NULL;

-- 8. Sửa order_items
UPDATE public.order_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at IS NOT NULL;

-- 9. Sửa order_buffet
UPDATE public.order_buffet 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at IS NOT NULL;

-- 10. Sửa tất cả bảng khác
UPDATE public.tables 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at IS NOT NULL OR updated_at IS NOT NULL);

UPDATE public.employees 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at IS NOT NULL OR updated_at IS NOT NULL);

UPDATE public.customers 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at IS NOT NULL OR updated_at IS NOT NULL);

UPDATE public.buffet_packages 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at IS NOT NULL OR updated_at IS NOT NULL);

UPDATE public.food_items 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    (created_at IS NOT NULL OR updated_at IS NOT NULL);

-- 11. Kiểm tra kết quả
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
LIMIT 3;

-- 12. Kiểm tra timezone consistency
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

-- 13. Hiển thị thời gian hiện tại
SELECT 
    'Current time check' as info,
    NOW() as postgres_now,
    NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vietnam_time,
    EXTRACT(TIMEZONE FROM NOW()) as timezone_offset;

-- 14. Thông báo hoàn thành
SELECT 'All timestamps updated to +7 UTC (Vietnam timezone)!' as message;
