-- Thêm column password vào table employees
-- Chạy trong Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '';

-- Update password cho employee "ly"
UPDATE employees 
SET password = '091101' 
WHERE username = 'ly';

-- Verify
SELECT id, username, fullname, password, is_active 
FROM employees 
WHERE username = 'ly';

