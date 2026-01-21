-- Script thêm cột quantity vào bảng order_buffet
-- Chạy script này trên Supabase SQL Editor

-- Thêm cột quantity vào bảng order_buffet
ALTER TABLE public.order_buffet 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Cập nhật các dòng hiện tại có quantity = 1
UPDATE public.order_buffet 
SET quantity = 1 
WHERE quantity IS NULL;

-- Thêm constraint để đảm bảo quantity > 0
ALTER TABLE public.order_buffet 
ADD CONSTRAINT check_quantity_positive 
CHECK (quantity > 0);

-- Thông báo hoàn thành
SELECT 'Column quantity added to order_buffet table successfully!' as message;
