const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testEmployeesAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing employees API logic...');
    
    // Test the exact query used by employees API
    const query = `
      SELECT id, employee_code as name, employee_code, position, 
             base_salary, commission_rate, is_active, created_at, updated_at
      FROM employees 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('Query:', query);
    
    const result = await client.query(query);
    console.log(`\n📊 Query result: ${result.rows.length} employees found`);
    
    result.rows.forEach((employee, index) => {
      console.log(`${index + 1}. ID: ${employee.id}`);
      console.log(`   Name: "${employee.name || 'NULL'}"`);
      console.log(`   Employee Code: "${employee.employee_code || 'NULL'}"`);
      console.log(`   Position: "${employee.position || 'NULL'}"`);
      console.log('');
    });
    
    // Test what frontend would receive
    const apiResponse = {
      employees: result.rows,
      total: result.rows.length,
      limit: 50,
      offset: 0
    };
    
    console.log('📤 API Response structure:');
    console.log('Total employees:', apiResponse.total);
    console.log('First employee for frontend:');
    if (apiResponse.employees[0]) {
      const employee = apiResponse.employees[0];
      console.log(`  - employee.name: "${employee.name || 'NULL'}"`);
      console.log(`  - employee.employee_code: "${employee.employee_code || 'NULL'}"`);
      console.log(`  - employee.position: "${employee.position || 'NULL'}"`);
    }
    
  } catch (error) {
    console.error('❌ Error testing employees API:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testEmployeesAPI().catch(console.error);
