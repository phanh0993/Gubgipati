-- Script xóa toàn bộ hệ thống printer cũ
-- File: DROP_ALL_PRINTER_TABLES.sql
-- Mô tả: Xóa tất cả bảng và dữ liệu liên quan đến printer

-- Xóa bảng food_printer_map (nếu có)
DROP TABLE IF EXISTS public.food_printer_map CASCADE;

-- Xóa bảng printer_mappings (nếu có)
DROP TABLE IF EXISTS public.printer_mappings CASCADE;

-- Xóa bảng printers (nếu có)
DROP TABLE IF EXISTS public.printers CASCADE;

-- Xóa các function liên quan (nếu có)
DROP FUNCTION IF EXISTS public.create_printer_mappings_table() CASCADE;

-- Kiểm tra kết quả
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%printer%' OR tablename LIKE '%print%')
ORDER BY tablename;

-- Thông báo hoàn thành
SELECT '✅ Đã xóa toàn bộ hệ thống printer cũ' as status;
