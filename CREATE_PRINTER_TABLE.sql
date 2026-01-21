-- Tạo bảng printer để quản lý máy in
-- File: CREATE_PRINTER_TABLE.sql
-- Mô tả: Bảng lưu thông tin kết nối máy in (USB port và IP)

-- Tạo bảng printers
CREATE TABLE IF NOT EXISTS public.printers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('usb', 'ip')),
    usb_port VARCHAR(255) NULL, -- Cho kết nối USB
    ip_address VARCHAR(45) NULL, -- Cho kết nối IP (IPv4/IPv6)
    port_number INTEGER NULL, -- Port cho kết nối IP
    driver_name VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    location VARCHAR(255) NULL, -- Vị trí máy in (bếp, quầy bar, etc.)
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_printers_connection_type ON public.printers(connection_type);
CREATE INDEX IF NOT EXISTS idx_printers_status ON public.printers(status);
CREATE INDEX IF NOT EXISTS idx_printers_name ON public.printers(name);

-- RLS (Row Level Security)
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả user đọc và ghi
DROP POLICY IF EXISTS "Allow all operations on printers" ON public.printers;
CREATE POLICY "Allow all operations on printers" ON public.printers
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.printers TO authenticated;
GRANT ALL ON public.printers TO anon;
GRANT USAGE, SELECT ON SEQUENCE printers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE printers_id_seq TO anon;

-- Thêm constraint để đảm bảo có ít nhất một loại kết nối
ALTER TABLE public.printers ADD CONSTRAINT check_connection_info 
    CHECK (
        (connection_type = 'usb' AND usb_port IS NOT NULL) OR
        (connection_type = 'ip' AND ip_address IS NOT NULL AND port_number IS NOT NULL)
    );

-- Kiểm tra bảng đã tạo thành công
SELECT 
    '✅ Bảng printers đã được tạo thành công' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'printers' AND table_schema = 'public';
