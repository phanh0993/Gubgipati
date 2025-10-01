-- Script đơn giản sửa timezone cho bảng invoices
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra dữ liệu hiện tại
SELECT 
    'BEFORE FIX - Invoices timestamps' as info,
    id,
    invoice_number,
    created_at,
    updated_at,
    invoice_date
FROM public.invoices
ORDER BY created_at DESC
LIMIT 3;

-- 2. Cấu hình timezone
SET timezone = 'Asia/Ho_Chi_Minh';

-- 3. Sửa tất cả invoices: thêm 7 giờ cho created_at và updated_at
UPDATE public.invoices 
SET 
    created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE 
    created_at IS NOT NULL 
    AND updated_at IS NOT NULL;

-- 4. Cập nhật invoice_date nếu cần
UPDATE public.invoices 
SET invoice_date = created_at
WHERE invoice_date IS NULL 
AND created_at IS NOT NULL;

-- 5. Sửa invoice_items để đồng bộ
UPDATE public.invoice_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at IS NOT NULL;

-- 6. Kiểm tra kết quả
SELECT 
    'AFTER FIX - Invoices timestamps' as info,
    id,
    invoice_number,
    created_at,
    updated_at,
    invoice_date
FROM public.invoices
ORDER BY created_at DESC
LIMIT 3;

-- 7. Thống kê tổng quan
SELECT 
    'Summary' as info,
    COUNT(*) as total_invoices,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM public.invoices;

-- 8. Thông báo hoàn thành
SELECT 'Invoices timezone fixed to +7 UTC!' as message;
