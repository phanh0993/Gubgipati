-- Script tạo tất cả bảng cần thiết cho hệ thống buffet
-- Chạy script này trên Supabase SQL Editor

-- 1. Bảng tables (bàn ăn)
CREATE TABLE IF NOT EXISTS public.tables (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  area VARCHAR(50),
  capacity INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng food_items (món ăn)
CREATE TABLE IF NOT EXISTS public.food_items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng buffet_packages (gói buffet)
CREATE TABLE IF NOT EXISTS public.buffet_packages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng orders (đơn hàng)
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  table_id BIGINT REFERENCES public.tables(id),
  customer_id BIGINT REFERENCES public.customers(id),
  employee_id BIGINT REFERENCES public.employees(id),
  order_type VARCHAR(20) DEFAULT 'buffet',
  status VARCHAR(20) DEFAULT 'open',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  buffet_package_id BIGINT REFERENCES public.buffet_packages(id),
  buffet_duration_minutes INTEGER DEFAULT 120,
  buffet_start_time TIMESTAMP WITH TIME ZONE,
  buffet_quantity INTEGER DEFAULT 0, -- Không dùng nữa, dùng order_buffet
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng order_items (món ăn trong đơn)
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_item_id BIGINT NOT NULL REFERENCES public.food_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng order_buffet (vé buffet - mỗi dòng = 1 vé)
CREATE TABLE IF NOT EXISTS public.order_buffet (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buffet_package_id BIGINT NOT NULL REFERENCES public.buffet_packages(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng invoices (hóa đơn)
CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  customer_id BIGINT REFERENCES public.customers(id),
  employee_id BIGINT REFERENCES public.employees(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Bảng invoice_items (chi tiết hóa đơn)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- 'food' hoặc 'buffet'
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_employee ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food ON public.order_items(food_item_id);

CREATE INDEX IF NOT EXISTS idx_order_buffet_order ON public.order_buffet(order_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_package ON public.order_buffet(buffet_package_id);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_employee ON public.invoices(employee_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- RLS Policies (Row Level Security)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buffet_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_buffet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Tạo policies đơn giản (cho phép tất cả - có thể tùy chỉnh sau)
DO $$ 
BEGIN
  -- Tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tables' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.tables FOR ALL USING (true);
  END IF;
  
  -- Food items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_items' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.food_items FOR ALL USING (true);
  END IF;
  
  -- Buffet packages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'buffet_packages' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.buffet_packages FOR ALL USING (true);
  END IF;
  
  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.orders FOR ALL USING (true);
  END IF;
  
  -- Order items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.order_items FOR ALL USING (true);
  END IF;
  
  -- Order buffet
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_buffet' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.order_buffet FOR ALL USING (true);
  END IF;
  
  -- Invoices
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.invoices FOR ALL USING (true);
  END IF;
  
  -- Invoice items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON public.invoice_items FOR ALL USING (true);
  END IF;
END $$;

-- Insert sample data
INSERT INTO public.tables (table_name, area, capacity) VALUES 
('Bàn 1', 'Tầng 1', 4),
('Bàn 2', 'Tầng 1', 6),
('Bàn 3', 'Tầng 2', 4),
('Bàn 4', 'Tầng 2', 8)
ON CONFLICT DO NOTHING;

INSERT INTO public.food_items (name, description, price, category) VALUES 
('Cơm tấm', 'Cơm tấm sườn nướng', 50000, 'Cơm'),
('Phở bò', 'Phở bò tái', 60000, 'Phở'),
('Bún bò Huế', 'Bún bò Huế cay', 55000, 'Bún'),
('Gỏi cuốn', 'Gỏi cuốn tôm thịt', 40000, 'Gỏi'),
('Chả cá', 'Chả cá Lã Vọng', 70000, 'Món nướng')
ON CONFLICT DO NOTHING;

INSERT INTO public.buffet_packages (name, description, price, duration_minutes) VALUES 
('Buffet Trưa', 'Buffet trưa với đầy đủ món ăn', 150000, 120),
('Buffet Tối', 'Buffet tối cao cấp', 200000, 150),
('Buffet Cuối Tuần', 'Buffet cuối tuần đặc biệt', 250000, 180)
ON CONFLICT DO NOTHING;

-- Thông báo hoàn thành
SELECT 'Database setup completed successfully!' as message;
