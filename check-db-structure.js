const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database structure...');
    
    // Check customers table structure
    console.log('\n📊 CUSTOMERS TABLE:');
    const customersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:', customersColumns.rows.map(row => row.column_name));
    
    // Check employees table structure
    console.log('\n👥 EMPLOYEES TABLE:');
    const employeesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:', employeesColumns.rows.map(row => row.column_name));
    
    // Check services table structure
    console.log('\n🛍️ SERVICES TABLE:');
    const servicesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:', servicesColumns.rows.map(row => row.column_name));
    
    // Sample data from each table
    console.log('\n📋 SAMPLE DATA:');
    
    if (customersColumns.rows.length > 0) {
      const customersSample = await client.query('SELECT * FROM customers LIMIT 2');
      console.log('Customers sample:', customersSample.rows);
    }
    
    if (employeesColumns.rows.length > 0) {
      const employeesSample = await client.query('SELECT * FROM employees LIMIT 2');
      console.log('Employees sample:', employeesSample.rows);
    }
    
    if (servicesColumns.rows.length > 0) {
      const servicesSample = await client.query('SELECT * FROM services LIMIT 2');
      console.log('Services sample:', servicesSample.rows);
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDatabaseStructure().catch(console.error);
