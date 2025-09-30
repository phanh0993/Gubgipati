-- Script test dữ liệu trong bảng order_buffet
-- Chạy script này trên Supabase SQL Editor để kiểm tra

-- 1. Kiểm tra tất cả dữ liệu trong order_buffet
SELECT 
    ob.id,
    ob.order_id,
    ob.buffet_package_id,
    ob.quantity,
    ob.created_at,
    o.order_number,
    o.table_id,
    bp.name as package_name,
    bp.price as package_price
FROM public.order_buffet ob
LEFT JOIN public.orders o ON ob.order_id = o.id
LEFT JOIN public.buffet_packages bp ON ob.buffet_package_id = bp.id
ORDER BY ob.created_at DESC;

-- 2. Tổng hợp theo order_id
SELECT 
    order_id,
    COUNT(*) as row_count,
    SUM(quantity) as total_quantity,
    MIN(created_at) as first_order,
    MAX(created_at) as last_order
FROM public.order_buffet
GROUP BY order_id
ORDER BY order_id DESC;

-- 3. Kiểm tra order gần nhất
SELECT 
    o.id as order_id,
    o.order_number,
    o.table_id,
    o.buffet_package_id,
    o.buffet_quantity as order_buffet_quantity,
    COALESCE(ob_sum.total_quantity, 0) as actual_buffet_quantity,
    ob_sum.row_count as buffet_rows
FROM public.orders o
LEFT JOIN (
    SELECT 
        order_id,
        COUNT(*) as row_count,
        SUM(quantity) as total_quantity
    FROM public.order_buffet
    GROUP BY order_id
) ob_sum ON o.id = ob_sum.order_id
WHERE o.order_type = 'buffet'
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. Thống kê tổng quan
SELECT 
    'Total orders' as metric,
    COUNT(*) as value
FROM public.orders 
WHERE order_type = 'buffet'

UNION ALL

SELECT 
    'Total buffet rows' as metric,
    COUNT(*) as value
FROM public.order_buffet

UNION ALL

SELECT 
    'Orders with buffet data' as metric,
    COUNT(DISTINCT order_id) as value
FROM public.order_buffet;
