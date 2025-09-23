-- SQL to check and modify foreign key constraints on invoice_items table
-- Run these on Supabase Dashboard > SQL Editor

-- 1. Check current foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='invoice_items';

-- 2. Drop the problematic foreign key constraint
ALTER TABLE invoice_items DROP CONSTRAINT invoice_items_service_id_fkey;

-- 3. Add new foreign key constraint to food_items (optional)
-- ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_service_id_food_items_fkey 
-- FOREIGN KEY (service_id) REFERENCES food_items(id);

-- 4. Alternative: Make service_id nullable and remove constraint entirely
-- ALTER TABLE invoice_items ALTER COLUMN service_id DROP NOT NULL;
