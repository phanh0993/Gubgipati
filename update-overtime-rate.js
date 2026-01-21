const { Pool } = require('pg');

async function updateOvertimeRate() {
  console.log('💰 Updating overtime hourly rate to 20,000₫/hour...');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    // Update default overtime rate for all employees
    const result = await client.query(`
      UPDATE employees 
      SET overtime_hourly_rate = 20000 
      WHERE overtime_hourly_rate = 50000 OR overtime_hourly_rate IS NULL
    `);
    
    console.log(`✅ Updated ${result.rowCount} employees to 20,000₫/hour overtime rate`);
    
    // Update the default value for new employees
    await client.query(`
      ALTER TABLE employees 
      ALTER COLUMN overtime_hourly_rate SET DEFAULT 20000
    `);
    
    console.log('✅ Set default overtime rate to 20,000₫/hour for new employees');
    
    // Check current rates
    const checkResult = await client.query(`
      SELECT fullname, overtime_hourly_rate 
      FROM employees 
      WHERE is_active = true
      ORDER BY fullname
    `);
    
    console.log('\n📋 Current overtime rates:');
    checkResult.rows.forEach(emp => {
      console.log(`- ${emp.fullname}: ${emp.overtime_hourly_rate?.toLocaleString('vi-VN')}₫/giờ`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateOvertimeRate().catch(console.error);
