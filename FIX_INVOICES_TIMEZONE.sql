-- Script sửa timezone cho bảng invoices để đồng bộ với orders
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại của invoices
SELECT 
    'BEFORE FIX - Invoices data' as info,
    id,
    invoice_number,
    created_at,
    updated_at,
    invoice_date,
    payment_status
FROM public.invoices
ORDER BY created_at DESC
LIMIT 5;

-- 2. Kiểm tra dữ liệu orders để so sánh
SELECT 
    'Orders data for comparison' as info,
    id,
    order_number,
    created_at,
    updated_at,
    buffet_start_time,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 3. Cấu hình timezone cho session
SET timezone = 'Asia/Ho_Chi_Minh';

-- 4. Sửa invoices có liên kết với orders
-- Cập nhật created_at và updated_at của invoices theo created_at của orders
UPDATE public.invoices 
SET 
    created_at = o.created_at,
    updated_at = o.updated_at
FROM public.orders o
WHERE invoices.id = (
    SELECT id FROM public.orders 
    WHERE order_number = invoices.invoice_number 
    OR notes LIKE '%' || invoices.invoice_number || '%'
    LIMIT 1
)
AND o.created_at IS NOT NULL;

-- 5. Sửa các invoices không có liên kết với orders
-- Thêm 7 giờ cho created_at và updated_at
UPDATE public.invoices 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    created_at < '2024-01-01 00:00:00+07'
    AND (created_at IS NOT NULL OR updated_at IS NOT NULL)
    AND id NOT IN (
        SELECT DISTINCT i.id 
        FROM public.invoices i
        JOIN public.orders o ON (
            i.invoice_number = o.order_number 
            OR i.notes LIKE '%' || o.order_number || '%'
        )
    );

-- 6. Cập nhật invoice_date nếu cần (đồng bộ với created_at)
UPDATE public.invoices 
SET invoice_date = created_at
WHERE invoice_date IS NULL 
AND created_at IS NOT NULL;

-- 7. Sửa invoice_items để đồng bộ với invoices
UPDATE public.invoice_items 
SET created_at = i.created_at
FROM public.invoices i
WHERE invoice_items.invoice_id = i.id
AND invoice_items.created_at IS NOT NULL
AND i.created_at IS NOT NULL;

-- 8. Kiểm tra kết quả sau khi sửa
SELECT 
    'AFTER FIX - Invoices data' as info,
    id,
    invoice_number,
    created_at,
    updated_at,
    invoice_date,
    payment_status
FROM public.invoices
ORDER BY created_at DESC
LIMIT 5;

-- 9. Kiểm tra timezone consistency giữa invoices và orders
SELECT 
    'Timezone consistency check' as info,
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN EXTRACT(HOUR FROM i.created_at) = EXTRACT(HOUR FROM o.created_at) THEN 1 END) as matching_created,
    COUNT(CASE WHEN EXTRACT(HOUR FROM i.updated_at) = EXTRACT(HOUR FROM o.updated_at) THEN 1 END) as matching_updated
FROM public.invoices i
LEFT JOIN public.orders o ON (
    i.invoice_number = o.order_number 
    OR i.notes LIKE '%' || o.order_number || '%'
)
WHERE i.created_at IS NOT NULL 
AND i.updated_at IS NOT NULL 
AND o.created_at IS NOT NULL 
AND o.updated_at IS NOT NULL;

-- 10. Hiển thị thống kê tổng quan
SELECT 
    'Summary statistics' as info,
    COUNT(*) as total_invoices,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM public.invoices
WHERE created_at IS NOT NULL 
AND updated_at IS NOT NULL;

-- 11. Thông báo hoàn thành
SELECT 'Invoices timezone updated to match orders (+7 UTC Vietnam timezone)!' as message;
