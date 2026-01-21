-- Script cập nhật menu sửa lỗi NOT NULL constraint cho cột "type"
-- File: menu cn1.xls
-- Ngày tạo: 06:46:38 2/10/2025

-- 1. Xóa dữ liệu liên quan trước (theo thứ tự foreign key)
-- Xóa order_items trước
DELETE FROM order_items;

-- Xóa buffet_package_items
DELETE FROM buffet_package_items;

-- Xóa food_items
DELETE FROM food_items;

-- 2. Tạo danh mục "Khác" nếu chưa có
INSERT INTO food_categories (name, description, is_active)
SELECT 'Khác', 'Danh mục khác', true
WHERE NOT EXISTS (SELECT 1 FROM food_categories WHERE name = 'Khác');

-- 3. Thêm món ăn mới với cột "type" (phân loại buffet/dịch vụ)
INSERT INTO food_items (name, price, description, category_id, is_available, printer_id, type, created_at) VALUES
('Bắp phô mai', 39000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Mini Bingsu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('tôm bơ tỏi giấy bạc', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('mì cay samjang', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('mì lạnh()', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mì cay samyang', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mì lạnh', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Tôm bơ tỏi nướng giấy bạc', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Lưỡi bò', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Bạch tuộc sốt cay', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Xoài', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Dưa lưới', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Dưa hấu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Soju + Tiger', 95000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Panahoai môn', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Pana Choco', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Pana Matcha', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Pana Đậu nành', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Pana Đào', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Pana Dâu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Kombucha Lựu Đỏ', 35000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('soju +yakult', 95000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('cá hồi thả lẩu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('dĩa thả lẩu tổng hợp', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('cá basa giấy bạc', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('sò điệp mỡ hành', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('phô mai que', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('thịt tổng hợp', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('hải sản tổng hợp', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mì tương đen', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Cá hồi nướng giấy bạc', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mực 1 nắng', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Heo Gubgi', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Sườn cừu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Sườn bò', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Vé trẻ em', 229000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Vé', 229000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Nồi nước lẩu cay', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('RƯỢU SOJU DƯA LƯỚI', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('RƯỢU SOJU DÂU', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('miến ăn lẩu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('mì ăn lẩu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Hải sản tổng hợp', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Thịt tổng hợp', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('đậu hủ phô mai thả lẩu', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('bia tiger bạc', 23000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('bia tiger nâu', 21000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Vé trẻ em', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Vé trẻ em', 169000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Lòng bò', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Kem vani', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Kem choco', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Rong biển', 9000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Somae', 99000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu Soju truyền thống', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu Soju vị đào', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu Soju vị táo', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu Soju vị việt quất', 79000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu gạo lớn', 89000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Rượu gạo nhỏ', 59000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Bia Blanc', 29000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Nước suối', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Pepsi', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Pepsi chanh', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Sting', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Xá xị', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Olong', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Mirinda sodaem', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('revice', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('revice chanh muối', 15000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Nước gạo rang nguyên vị', 28000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Nước gạo rang vị đào', 28000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Nước gạo rang vị dâu', 28000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Combo buffet nước và tráng miệng', 35000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Buffet tráng miệng', 25000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Buffet nước', 19000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Khăn lạnh', 2000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Vé', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Vé', 169000, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'service', NOW()),
('Ba chỉ bò - 소뱃살', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('thăn lưng bò - 소등심', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Bắp hoa bò - 소앞다리살', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('bò cuộn nấmim châm - 소뱃살 말이 팽이버섯', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Bò Gubgi - 구브기 소고기 요리', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('ba chỉ heo nướng tảng - 통삼겹살 구이', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('ba chỉ Heo rừng - 멧돼지 삼겹살', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('da heo - 돼지껍데기', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Chân gà rút xương - 뼈 없는 닭발', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('cánh gàhúc giữa - 닭다리', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Tôm - 새우', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Bạch tuộc - 문어', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Lườn cá hồi - 연어 뱃살', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Soup rong biển - 미역국', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Soupim chi - 김치찌개', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Soup bulgubgi - 소불고기국', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Cơm trộn - 비빔밥', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Miến trộn - 잡채', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mì trộn cay sốt phô mai - 매운 치즈 비빔면', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Tokbokki Gubgi - 치즈 떡볶이', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('khoai tây chiên - 감자튀김', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Mandu chiên - 튀긴 만두', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Thăn ngoại', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Gù bò - 소등심', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Vú heo - 돼지 유방', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Sò điệp phô mai - 가리비', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Râu mực - 오징어 뿔', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Cơm bò bắp - 소고기 볶음밥', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Chả cá hàn quốc thả lẩu - 어묵', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('Bánh bao trứng nhím - 만두', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW()),
('đĩa thả lẩu tổng hợp - 혼합 전골 재료', 0, '', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, 'buffet', NOW());

-- 4. Báo cáo kết quả
SELECT 
  'Tổng món ăn' as loai,
  COUNT(*) as so_luong
FROM food_items
UNION ALL
SELECT 
  'Món buffet (0đ)' as loai,
  COUNT(*) as so_luong
FROM food_items 
WHERE price = 0
UNION ALL
SELECT 
  'Món dịch vụ (có giá)' as loai,
  COUNT(*) as so_luong
FROM food_items 
WHERE price > 0;
