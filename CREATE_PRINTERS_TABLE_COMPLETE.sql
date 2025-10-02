-- Tạo bảng printers hoàn chỉnh với tất cả cột cần thiết
-- File: CREATE_PRINTERS_TABLE_COMPLETE.sql
-- Chạy script này trên Supabase SQL Editor

-- Tạo bảng printers
CREATE TABLE IF NOT EXISTS public.printers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  printer_type TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  driver TEXT,
  port TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm RLS
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

-- Policy cho tất cả users
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.printers;
CREATE POLICY "Enable all for authenticated users" 
ON public.printers FOR ALL 
TO authenticated 
USING (true);

-- Policy cho anon users (để Vercel có thể truy cập)
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.printers;
CREATE POLICY "Enable read access for anon users" 
ON public.printers FOR SELECT 
TO anon 
USING (true);

-- Thêm máy in May Nong
INSERT INTO public.printers (name, ip_address, printer_type, is_active, driver, port)
VALUES (
  'May Nong', 
  '192.168.1.234', 
  'manual', 
  true, 
  'Windows Printer Driver', 
  '9100'
)
ON CONFLICT (name) DO UPDATE SET
  ip_address = EXCLUDED.ip_address,
  printer_type = EXCLUDED.printer_type,
  is_active = EXCLUDED.is_active,
  driver = EXCLUDED.driver,
  port = EXCLUDED.port,
  updated_at = NOW();

-- Kiểm tra kết quả
SELECT * FROM public.printers;
