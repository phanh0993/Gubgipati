const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function cleanTestEmployees() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting to clean test employees...');
    
    // Check if employees table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'employees'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Employees table does not exist');
      return;
    }
    
    // Get current employees count
    const countResult = await client.query('SELECT COUNT(*) as count FROM employees');
    const currentCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Current employees count: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('✅ No employees to clean');
      return;
    }
    
    // Show current employees
    const employeesResult = await client.query('SELECT id, name, employee_code FROM employees ORDER BY id');
    console.log('📋 Current employees:');
    employeesResult.rows.forEach(emp => {
      console.log(`  - ID: ${emp.id}, Name: ${emp.name}, Code: ${emp.employee_code}`);
    });
    
    // Delete all employees (soft delete by setting is_active = false)
    const deleteResult = await client.query(`
      UPDATE employees 
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true
    `);
    
    console.log(`✅ Soft deleted ${deleteResult.rowCount} employees`);
    
    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM employees WHERE is_active = true');
    const remainingCount = parseInt(verifyResult.rows[0].count);
    console.log(`📊 Remaining active employees: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All test employees have been cleaned successfully!');
    } else {
      console.log('⚠️ Some employees are still active');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning employees:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanTestEmployees().catch(console.error);
