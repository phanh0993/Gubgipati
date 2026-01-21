const { Pool } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.yydxhcvxkmxbohqtbbvw:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkSchema() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mobile_print_queue'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'mobile_print_queue'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n=== COLUMNS của mobile_print_queue ===');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Get sample data
      const data = await pool.query('SELECT * FROM mobile_print_queue LIMIT 3');
      console.log('\n=== SAMPLE DATA ===');
      console.log(JSON.stringify(data.rows, null, 2));
    } else {
      console.log('\n❌ Bảng mobile_print_queue KHÔNG TỒN TẠI!');
      console.log('💡 Cần tạo bảng bằng SQL trong Supabase Dashboard');
    }
    
  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();

