const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addEmployeeNameColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Adding employee name column...');
    
    // Add fullname column to employees table
    await client.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS fullname VARCHAR(255)
    `);
    
    console.log('✅ Added fullname column to employees table');
    
    // Update existing employee with a proper name
    await client.query(`
      UPDATE employees 
      SET fullname = 'Nguyễn Văn A'
      WHERE employee_code = '000009' AND fullname IS NULL
    `);
    
    console.log('✅ Updated existing employee with name');
    
    // Check the result
    const result = await client.query('SELECT * FROM employees');
    console.log('📊 Current employees:');
    result.rows.forEach(emp => {
      console.log(`- ID: ${emp.id}, Code: ${emp.employee_code}, Name: ${emp.fullname || 'NULL'}, Position: ${emp.position}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding employee name column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addEmployeeNameColumn().catch(console.error);
