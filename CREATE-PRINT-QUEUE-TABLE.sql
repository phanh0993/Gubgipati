-- Tạo bảng mobile_print_queue để xử lý in từ mobile
-- Chạy trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mobile_print_queue (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  printer_name VARCHAR(100) NOT NULL,
  printer_location VARCHAR(50),
  image_base64 TEXT NOT NULL,
  filename VARCHAR(255),
  meta JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT
);

-- Index cho query nhanh
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON mobile_print_queue(status);
CREATE INDEX IF NOT EXISTS idx_print_queue_created ON mobile_print_queue(created_at);

-- RLS: Disable cho development (enable lại trên production)
ALTER TABLE mobile_print_queue DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO mobile_print_queue (order_id, printer_name, printer_location, image_base64, filename, meta)
VALUES (1, 'POS-80C', 'Bếp', 'data:image/png;base64,test', 'test.png', '{"test": true}');

-- Verify
SELECT * FROM mobile_print_queue ORDER BY created_at DESC LIMIT 5;

