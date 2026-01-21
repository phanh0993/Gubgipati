-- Tạo function để tạo bảng printer_mappings
-- File: create-printer-mappings-function.sql

CREATE OR REPLACE FUNCTION create_printer_mappings_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Tạo bảng printer_mappings nếu chưa tồn tại
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
        ('bar', 'Default Printer', 'Default Printer'),
        ('kitchen_grill', 'Default Printer', 'Default Printer'),
        ('kitchen_fry', 'Default Printer', 'Default Printer'),
        ('kitchen_other', 'Default Printer', 'Default Printer'),
        ('invoice_main', 'Default Printer', 'Default Printer')
    ON CONFLICT (group_key) DO NOTHING;

    RAISE NOTICE 'Table printer_mappings created successfully';
END;
$$;
