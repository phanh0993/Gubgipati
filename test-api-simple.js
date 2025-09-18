const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testAPISimple() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing API logic directly...');
    
    // Test the exact query used by customers API
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name IN ('name', 'fullname')
    `);
    
    const columnName = columnCheck.rows.length > 0 ? columnCheck.rows[0].column_name : 'name';
    console.log(`Using column: ${columnName}`);
    
    // Test the exact query from API
    const query = `
      SELECT id, ${columnName} as name, ${columnName} as fullname, phone, email, address, gender, birth_date, 
             loyalty_points, is_active, created_at, updated_at
      FROM customers 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('Query:', query);
    
    const result = await client.query(query);
    console.log(`\n📊 Query result: ${result.rows.length} customers found`);
    
    result.rows.forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}`);
      console.log(`   Name: "${customer.name || 'NULL'}"`);
      console.log(`   Fullname: "${customer.fullname || 'NULL'}"`);
      console.log(`   Phone: "${customer.phone || 'NULL'}"`);
      console.log(`   Gender: "${customer.gender || 'NULL'}"`);
      console.log('');
    });
    
    // Test what frontend would receive
    const apiResponse = {
      customers: result.rows,
      total: result.rows.length,
      limit: 50,
      offset: 0
    };
    
    console.log('📤 API Response structure:');
    console.log('Total customers:', apiResponse.total);
    console.log('First customer for frontend:');
    if (apiResponse.customers[0]) {
      const customer = apiResponse.customers[0];
      console.log(`  - customer.name: "${customer.name || 'NULL'}"`);
      console.log(`  - customer.fullname: "${customer.fullname || 'NULL'}"`);
      console.log(`  - customer.name || customer.fullname: "${customer.name || customer.fullname || 'NULL'}"`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testAPISimple().catch(console.error);
