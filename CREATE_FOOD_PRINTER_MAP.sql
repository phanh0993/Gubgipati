-- Bảng gán món ăn -> máy in cụ thể
CREATE TABLE IF NOT EXISTS public.food_printer_map (
  id BIGSERIAL PRIMARY KEY,
  food_item_id BIGINT NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  printer_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_printer_map_food ON public.food_printer_map(food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_printer_map_printer ON public.food_printer_map(printer_name);

ALTER TABLE public.food_printer_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for food_printer_map" ON public.food_printer_map;
CREATE POLICY "Enable all operations for food_printer_map"
  ON public.food_printer_map
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.food_printer_map TO anon, authenticated;

-- Kiểm tra nhanh
SELECT 'rows' AS info, COUNT(*)::text AS value FROM public.food_printer_map;

