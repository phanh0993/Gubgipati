-- Migration script to add food_item_id column to invoice_items table
-- Run this SQL on Supabase Dashboard > SQL Editor

-- 1. Add food_item_id column
ALTER TABLE invoice_items ADD COLUMN food_item_id INTEGER;

-- 2. Add foreign key constraint to food_items table
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_food_item_id_fkey 
FOREIGN KEY (food_item_id) REFERENCES food_items(id);

-- 3. Copy existing service_id data to food_item_id where applicable
-- For buffet tickets (service_id = 33, 34, 35), copy to food_item_id
UPDATE invoice_items 
SET food_item_id = service_id 
WHERE service_id IN (33, 34, 35);

-- 4. Optional: Drop service_id column after verification
-- ALTER TABLE invoice_items DROP COLUMN service_id;
