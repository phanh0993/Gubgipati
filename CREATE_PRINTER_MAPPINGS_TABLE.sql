-- Tạo bảng printer_mappings để lưu cấu hình máy in
-- File: CREATE_PRINTER_MAPPINGS_TABLE.sql
-- Mô tả: Tạo bảng để gán máy in cho từng nhóm món ăn

-- Tạo bảng printer_mappings
CREATE TABLE IF NOT EXISTS public.printer_mappings (
    id SERIAL PRIMARY KEY,
    group_key VARCHAR(50) NOT NULL UNIQUE,
    printer_uri VARCHAR(255) NOT NULL,
    printer_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm comment cho bảng
COMMENT ON TABLE public.printer_mappings IS 'Cấu hình gán máy in cho từng nhóm món ăn';

-- Thêm comment cho các cột
COMMENT ON COLUMN public.printer_mappings.group_key IS 'Tên nhóm: bar, kitchen_grill, kitchen_fry, kitchen_other, invoice_main';
COMMENT ON COLUMN public.printer_mappings.printer_uri IS 'Tên máy in (dùng để gọi API print)';
COMMENT ON COLUMN public.printer_mappings.printer_name IS 'Tên hiển thị của máy in';

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_printer_mappings_group_key ON public.printer_mappings(group_key);

-- Thêm RLS (Row Level Security) nếu cần
ALTER TABLE public.printer_mappings ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho RLS (cho phép tất cả operations)
CREATE POLICY IF NOT EXISTS "Enable all operations for printer_mappings" ON public.printer_mappings
    FOR ALL USING (true);

-- Insert dữ liệu mẫu (optional)
INSERT INTO public.printer_mappings (group_key, printer_uri, printer_name) VALUES
    ('bar', 'HP LaserJet Pro', 'HP LaserJet Pro'),
    ('kitchen_grill', 'Canon PIXMA', 'Canon PIXMA'),
    ('kitchen_fry', 'Epson L3150', 'Epson L3150'),
    ('kitchen_other', 'Brother MFC', 'Brother MFC'),
    ('invoice_main', 'HP LaserJet Pro', 'HP LaserJet Pro')
ON CONFLICT (group_key) DO NOTHING;

-- Kiểm tra kết quả
SELECT 
    'Tổng số mappings' as thong_tin,
    COUNT(*) as so_luong 
FROM public.printer_mappings
UNION ALL
SELECT 
    group_key as thong_tin,
    printer_name as so_luong
FROM public.printer_mappings
ORDER BY thong_tin;
