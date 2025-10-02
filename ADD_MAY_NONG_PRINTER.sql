-- Thêm máy in "May Nong" vào bảng printers
-- File: ADD_MAY_NONG_PRINTER.sql
-- Mô tả: Thêm máy in bếp với IP 192.168.1.234

-- Thêm máy in "May Nong"
INSERT INTO printers (name, ip_address, printer_type, is_active, driver, port, created_at)
VALUES (
    'May Nong', 
    '192.168.1.234', 
    'manual', 
    true, 
    'Windows Printer Driver', 
    '9100', 
    NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
)
ON CONFLICT (name) DO UPDATE SET
    ip_address = EXCLUDED.ip_address,
    printer_type = EXCLUDED.printer_type,
    is_active = EXCLUDED.is_active,
    driver = EXCLUDED.driver,
    port = EXCLUDED.port,
    updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC';

-- Kiểm tra kết quả
SELECT * FROM printers WHERE name = 'May Nong';
