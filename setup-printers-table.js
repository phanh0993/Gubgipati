// Script tạo bảng printers và thêm máy in May Nong
require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupPrinters() {
  try {
    console.log('🔧 Creating printers table...');
    
    // Tạo bảng printers
    const { error: createError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.printers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          ip_address TEXT,
          printer_type TEXT DEFAULT 'manual',
          is_active BOOLEAN DEFAULT true,
          driver TEXT,
          port TEXT,
          location TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Thêm RLS
        ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
        
        -- Policy cho tất cả users
        CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" 
        ON public.printers FOR ALL 
        TO authenticated 
        USING (true);
        
        -- Policy cho anon users (để Vercel có thể truy cập)
        CREATE POLICY IF NOT EXISTS "Enable read access for anon users" 
        ON public.printers FOR SELECT 
        TO anon 
        USING (true);
      `
    });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
    } else {
      console.log('✅ Printers table created successfully');
    }
    
    console.log('🖨️ Adding May Nong printer...');
    
    // Thêm máy in May Nong
    const { data: printer, error: insertError } = await supabase
      .from('printers')
      .upsert({
        name: 'May Nong',
        ip_address: '192.168.1.234',
        printer_type: 'manual',
        is_active: true,
        driver: 'Windows Printer Driver',
        port: '9100'
      }, {
        onConflict: 'name'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error adding May Nong printer:', insertError);
    } else {
      console.log('✅ May Nong printer added:', printer);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

setupPrinters();
