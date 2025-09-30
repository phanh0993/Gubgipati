-- Script sửa bảng order_buffet - tạo cột quantity và sắp xếp lại
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra cấu trúc bảng hiện tại
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_buffet' 
ORDER BY ordinal_position;

-- 2. Thêm cột quantity nếu chưa có
ALTER TABLE public.order_buffet 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- 3. Cập nhật các dòng hiện tại có quantity = 1
UPDATE public.order_buffet 
SET quantity = 1 
WHERE quantity IS NULL;

-- 4. Thêm constraint để đảm bảo quantity > 0
ALTER TABLE public.order_buffet 
DROP CONSTRAINT IF EXISTS check_quantity_positive;

ALTER TABLE public.order_buffet 
ADD CONSTRAINT check_quantity_positive 
CHECK (quantity > 0);

-- 5. Thêm NOT NULL constraint cho quantity
ALTER TABLE public.order_buffet 
ALTER COLUMN quantity SET NOT NULL;

-- 6. Cập nhật cấu trúc bảng để có thứ tự đúng
-- (id, order_id, buffet_package_id, quantity, created_at)
ALTER TABLE public.order_buffet 
ALTER COLUMN id SET NOT NULL,
ALTER COLUMN order_id SET NOT NULL,
ALTER COLUMN buffet_package_id SET NOT NULL,
ALTER COLUMN quantity SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL;

-- 7. Tạo lại indexes
DROP INDEX IF EXISTS idx_order_buffet_order;
DROP INDEX IF EXISTS idx_order_buffet_package;

CREATE INDEX IF NOT EXISTS idx_order_buffet_order ON public.order_buffet(order_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_package ON public.order_buffet(buffet_package_id);
CREATE INDEX IF NOT EXISTS idx_order_buffet_quantity ON public.order_buffet(quantity);

-- 8. Kiểm tra cấu trúc bảng sau khi sửa
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_buffet' 
ORDER BY ordinal_position;

-- 9. Test insert dữ liệu mẫu
INSERT INTO public.order_buffet (order_id, buffet_package_id, quantity) 
VALUES (999, 33, 3) 
ON CONFLICT DO NOTHING;

-- 10. Xóa dữ liệu test
DELETE FROM public.order_buffet WHERE order_id = 999;

-- Thông báo hoàn thành
SELECT 'Order_buffet table fixed successfully!' as message;
