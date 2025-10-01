-- Script sửa timezone cho TẤT CẢ các bảng có cột thời gian về +7 UTC
-- Chạy script này trên Supabase SQL Editor

-- 1. Cập nhật bảng orders
UPDATE public.orders 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.orders 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

UPDATE public.orders 
SET buffet_start_time = buffet_start_time + INTERVAL '7 hours'
WHERE buffet_start_time < '2024-01-01 00:00:00+07'
AND buffet_start_time IS NOT NULL;

-- 2. Cập nhật bảng order_items
UPDATE public.order_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- 3. Cập nhật bảng order_buffet
UPDATE public.order_buffet 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- 4. Cập nhật bảng invoices
UPDATE public.invoices 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.invoices 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 5. Cập nhật bảng invoice_items
UPDATE public.invoice_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

-- 6. Cập nhật bảng tables
UPDATE public.tables 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.tables 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 7. Cập nhật bảng employees
UPDATE public.employees 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.employees 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 8. Cập nhật bảng customers
UPDATE public.customers 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.customers 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 9. Cập nhật bảng buffet_packages
UPDATE public.buffet_packages 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.buffet_packages 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 10. Cập nhật bảng food_items
UPDATE public.food_items 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < '2024-01-01 00:00:00+07'
AND created_at IS NOT NULL;

UPDATE public.food_items 
SET updated_at = updated_at + INTERVAL '7 hours'
WHERE updated_at < '2024-01-01 00:00:00+07'
AND updated_at IS NOT NULL;

-- 11. Kiểm tra kết quả tổng quan
SELECT 
    'orders' as table_name,
    COUNT(*) as total_rows,
    MIN(created_at) as min_created,
    MAX(created_at) as max_created
FROM public.orders

UNION ALL

SELECT 
    'order_items' as table_name,
    COUNT(*) as total_rows,
    MIN(created_at) as min_created,
    MAX(created_at) as max_created
FROM public.order_items

UNION ALL

SELECT 
    'order_buffet' as table_name,
    COUNT(*) as total_rows,
    MIN(created_at) as min_created,
    MAX(created_at) as max_created
FROM public.order_buffet

UNION ALL

SELECT 
    'invoices' as table_name,
    COUNT(*) as total_rows,
    MIN(created_at) as min_created,
    MAX(created_at) as max_created
FROM public.invoices;

-- 12. Thông báo hoàn thành
SELECT 'All tables timezone updated to +7 UTC (Vietnam timezone)!' as message;
