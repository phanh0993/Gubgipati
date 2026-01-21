-- Script cập nhật danh sách bàn mới
-- Chạy script này trên Supabase SQL Editor

-- Đảm bảo cột table_number tồn tại (nếu chưa có)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tables' 
    AND column_name = 'table_number'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN table_number VARCHAR(10);
  END IF;
END $$;

-- Xóa tất cả bàn cũ (nếu muốn giữ lại dữ liệu order, comment dòng này)
-- DELETE FROM public.tables;

-- Hoặc chỉ xóa các bàn không có order đang active (an toàn hơn)
-- DELETE FROM public.tables 
-- WHERE id NOT IN (SELECT DISTINCT table_id FROM public.orders WHERE status IN ('pending', 'open'));

-- Xóa tất cả bàn cũ và insert lại (cách này sẽ reset ID)
TRUNCATE TABLE public.tables RESTART IDENTITY CASCADE;

-- Insert danh sách bàn mới
-- Khu A: 9 bàn từ A-1 đến A-9
INSERT INTO public.tables (table_name, area, table_number, capacity) VALUES 
('A-1', 'A', '1', 4),
('A-2', 'A', '2', 4),
('A-3', 'A', '3', 4),
('A-4', 'A', '4', 4),
('A-5', 'A', '5', 4),
('A-6', 'A', '6', 4),
('A-7', 'A', '7', 4),
('A-8', 'A', '8', 4),
('A-9', 'A', '9', 4),

-- Khu B: 9 bàn từ B-1 đến B-9
('B-1', 'B', '1', 4),
('B-2', 'B', '2', 4),
('B-3', 'B', '3', 4),
('B-4', 'B', '4', 4),
('B-5', 'B', '5', 4),
('B-6', 'B', '6', 4),
('B-7', 'B', '7', 4),
('B-8', 'B', '8', 4),
('B-9', 'B', '9', 4),

-- Khu C: 4 bàn từ C-1 đến C-4
('C-1', 'C', '1', 4),
('C-2', 'C', '2', 4),
('C-3', 'C', '3', 4),
('C-4', 'C', '4', 4),

-- Khu D: 9 bàn từ D-1 đến D-9
('D-1', 'D', '1', 4),
('D-2', 'D', '2', 4),
('D-3', 'D', '3', 4),
('D-4', 'D', '4', 4),
('D-5', 'D', '5', 4),
('D-6', 'D', '6', 4),
('D-7', 'D', '7', 4),
('D-8', 'D', '8', 4),
('D-9', 'D', '9', 4);

-- Kiểm tra kết quả
SELECT area, COUNT(*) as so_ban, STRING_AGG(table_name, ', ' ORDER BY table_number) as danh_sach_ban
FROM public.tables
GROUP BY area
ORDER BY area;

-- Thông báo hoàn thành
SELECT 'Danh sách bàn đã được cập nhật thành công!' as message;

