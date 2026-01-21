-- Tạo bảng map_printer để quy định món ăn in ở máy in nào
-- File: CREATE_MAP_PRINTER_TABLE.sql
-- Mô tả: Bảng mapping giữa máy in và món ăn

-- Tạo bảng map_printer
CREATE TABLE IF NOT EXISTS public.map_printer (
    id SERIAL PRIMARY KEY,
    printer_id INTEGER NOT NULL,
    food_item_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_map_printer_printer 
        FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE,
    CONSTRAINT fk_map_printer_food_item 
        FOREIGN KEY (food_item_id) REFERENCES public.food_items(id) ON DELETE CASCADE,
    
    -- Unique constraint để tránh duplicate
    CONSTRAINT unique_printer_food_item 
        UNIQUE (printer_id, food_item_id)
);

-- Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_map_printer_printer_id ON public.map_printer(printer_id);
CREATE INDEX IF NOT EXISTS idx_map_printer_food_item_id ON public.map_printer(food_item_id);
CREATE INDEX IF NOT EXISTS idx_map_printer_created_at ON public.map_printer(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.map_printer ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả user đọc và ghi
DROP POLICY IF EXISTS "Allow all operations on map_printer" ON public.map_printer;
CREATE POLICY "Allow all operations on map_printer" ON public.map_printer
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.map_printer TO authenticated;
GRANT ALL ON public.map_printer TO anon;
GRANT USAGE, SELECT ON SEQUENCE map_printer_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE map_printer_id_seq TO anon;

-- Tạo bảng print_templates để lưu mẫu in
CREATE TABLE IF NOT EXISTS public.print_templates (
    id SERIAL PRIMARY KEY,
    printer_id INTEGER NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('bill', 'kitchen', 'bar')),
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_print_templates_printer 
        FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT unique_printer_template_type 
        UNIQUE (printer_id, template_type)
);

-- Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_print_templates_printer_id ON public.print_templates(printer_id);
CREATE INDEX IF NOT EXISTS idx_print_templates_type ON public.print_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_print_templates_active ON public.print_templates(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả user đọc và ghi
DROP POLICY IF EXISTS "Allow all operations on print_templates" ON public.print_templates;
CREATE POLICY "Allow all operations on print_templates" ON public.print_templates
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.print_templates TO authenticated;
GRANT ALL ON public.print_templates TO anon;
GRANT USAGE, SELECT ON SEQUENCE print_templates_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE print_templates_id_seq TO anon;

-- Kiểm tra bảng đã tạo thành công
SELECT 
    '✅ Bảng map_printer đã được tạo thành công' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'map_printer' AND table_schema = 'public'

UNION ALL

SELECT 
    '✅ Bảng print_templates đã được tạo thành công' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'print_templates' AND table_schema = 'public';
