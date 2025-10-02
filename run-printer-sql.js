// Script để chạy SQL thêm cột driver và máy in May Nong
require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runSQL() {
  try {
    console.log('🔧 Adding driver column to printers table...');
    
    // Thêm cột driver
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'printers' 
                AND column_name = 'driver'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.printers 
                ADD COLUMN driver TEXT;
                
                COMMENT ON COLUMN public.printers.driver IS 'Driver máy in (VD: HP Universal Printing PS)';
                
                RAISE NOTICE 'Đã thêm cột driver vào bảng printers thành công';
            ELSE
                RAISE NOTICE 'Cột driver đã tồn tại trong bảng printers';
            END IF;
        END $$;
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding driver column:', alterError);
    } else {
      console.log('✅ Driver column added successfully');
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

runSQL();
