const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testCustomersAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing customers API...');
    
    // Check table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    tableCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check which name column exists
    const nameColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name IN ('name', 'fullname')
    `);
    
    console.log('\n📝 Name columns found:');
    nameColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    // Get sample data
    const sampleData = await client.query(`
      SELECT id, name, fullname, phone, gender 
      FROM customers 
      WHERE is_active = true 
      LIMIT 5
    `);
    
    console.log('\n👥 Sample customers:');
    sampleData.rows.forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}`);
      console.log(`   Name: ${customer.name || 'NULL'}`);
      console.log(`   Fullname: ${customer.fullname || 'NULL'}`);
      console.log(`   Phone: ${customer.phone || 'NULL'}`);
      console.log(`   Gender: ${customer.gender || 'NULL'}`);
      console.log('');
    });
    
    // Test the actual query used by API
    const columnName = nameColumns.rows.length > 0 ? nameColumns.rows[0].column_name : 'name';
    console.log(`\n🔧 Testing API query with column: ${columnName}`);
    
    const apiQuery = `
      SELECT id, ${columnName} as name, ${columnName} as fullname, phone, email, address, gender, birth_date, 
             loyalty_points, is_active, created_at, updated_at
      FROM customers 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    const apiResult = await client.query(apiQuery);
    console.log('\n📊 API query result:');
    apiResult.rows.forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}`);
      console.log(`   Name: ${customer.name || 'NULL'}`);
      console.log(`   Fullname: ${customer.fullname || 'NULL'}`);
      console.log(`   Phone: ${customer.phone || 'NULL'}`);
      console.log(`   Gender: ${customer.gender || 'NULL'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing customers API:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testCustomersAPI().catch(console.error);
