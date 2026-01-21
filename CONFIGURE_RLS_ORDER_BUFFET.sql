-- Script cấu hình RLS cho bảng order_buffet
-- Chạy script này trên Supabase SQL Editor

-- 1. Bật RLS cho bảng order_buffet
ALTER TABLE public.order_buffet ENABLE ROW LEVEL SECURITY;

-- 2. Tạo policy cho phép đọc tất cả dữ liệu
CREATE POLICY "Allow all operations on order_buffet" ON public.order_buffet
FOR ALL USING (true) WITH CHECK (true);

-- 3. Kiểm tra RLS đã được bật
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'order_buffet';

-- 4. Kiểm tra policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'order_buffet';

-- 5. Test query
SELECT COUNT(*) as total_rows FROM public.order_buffet;

-- Thông báo hoàn thành
SELECT 'RLS configured for order_buffet!' as message;
