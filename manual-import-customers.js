const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// Function to parse Excel to customers
function parseExcelToCustomers(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length < 2) {
    return [];
  }

  const headers = data[0];
  const customers = [];

  console.log('Excel headers:', headers);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length === 0) continue;

    const customer = {};
    
    // Map columns to customer fields
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined) {
        const value = row[index];
        const headerLower = header.toLowerCase().trim();
        
        // Map various Vietnamese column names
        if (headerLower.includes('tên') || headerLower.includes('name') || headerLower.includes('họ tên')) {
          customer.name = value;
        } else if (headerLower.includes('điện thoại') || headerLower.includes('phone') || headerLower.includes('số điện thoại')) {
          customer.phone = value;
        } else if (headerLower.includes('email') || headerLower.includes('mail')) {
          customer.email = value;
        } else if (headerLower.includes('địa chỉ') || headerLower.includes('address')) {
          customer.address = value;
        } else if (headerLower.includes('giới tính') || headerLower.includes('gender') || headerLower.includes('sex')) {
          customer.gender = value;
        } else if (headerLower.includes('ngày sinh') || headerLower.includes('birth') || headerLower.includes('sinh nhật')) {
          customer.birth_date = value;
        }
      }
    });

    // Clean and validate data
    if (customer.name && customer.phone) {
      customer.name = (customer.name || '').toString().trim();
      customer.phone = (customer.phone || '').toString().trim().replace(/\D/g, '');
      
      if (customer.phone.length >= 10) {
        customers.push({
          name: customer.name,
          phone: customer.phone,
          email: (customer.email || '').toString().trim(),
          address: (customer.address || '').toString().trim(),
          gender: (customer.gender || '').toString().trim(),
          birth_date: customer.birth_date || null
        });
      }
    }
  }

  return customers;
}

async function importCustomers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting manual import of customers from khachhang.xlsx...');
    
    // Read Excel file
    const filePath = './khachhang.xlsx';
    if (!fs.existsSync(filePath)) {
      console.error('❌ File khachhang.xlsx not found!');
      return;
    }
    
    const buffer = fs.readFileSync(filePath);
    const customers = parseExcelToCustomers(buffer);
    
    console.log(`📊 Parsed ${customers.length} customers from Excel file`);
    
    if (customers.length === 0) {
      console.log('❌ No valid customers found in Excel file');
      return;
    }
    
    // Show first few customers
    console.log('📋 First 5 customers:');
    customers.slice(0, 5).forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} - ${customer.phone}`);
    });
    
    // Ensure customers table exists with all columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        address TEXT,
        gender VARCHAR(10),
        birth_date DATE,
        loyalty_points INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add missing columns if they don't exist
    try {
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(10)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
      console.log('✅ Ensured all required columns exist');
    } catch (alterError) {
      console.log('⚠️ Column addition error (might already exist):', alterError.message);
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Import customers one by one
    for (const customer of customers) {
      try {
        // Check if customer already exists by phone
        const existingCustomer = await client.query(
          'SELECT id FROM customers WHERE phone = $1',
          [customer.phone]
        );

        // Check which column exists (name or fullname)
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'customers' AND column_name IN ('name', 'fullname')
        `);
        const columnName = columnCheck.rows.length > 0 ? columnCheck.rows[0].column_name : 'name';
        console.log(`Using column: ${columnName}`);

        if (existingCustomer.rows.length > 0) {
          // Update existing customer
          await client.query(`
            UPDATE customers SET
              ${columnName} = $1,
              email = $2,
              address = $3,
              gender = $4,
              birth_date = $5,
              updated_at = NOW()
            WHERE phone = $6
          `, [customer.name, customer.email, customer.address, customer.gender, customer.birth_date, customer.phone]);
          console.log(`🔄 Updated existing customer: ${customer.name} (${customer.phone})`);
        } else {
          // Insert new customer
          await client.query(`
            INSERT INTO customers (${columnName}, phone, email, address, gender, birth_date, loyalty_points, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW(), NOW())
          `, [customer.name, customer.phone, customer.email, customer.address, customer.gender, customer.birth_date]);
          console.log(`✅ Inserted new customer: ${customer.name} (${customer.phone})`);
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMsg = `Error importing customer "${customer.name}": ${error.message}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} customers`);
    console.log(`❌ Errors: ${errorCount} customers`);
    console.log(`📈 Total processed: ${customers.length} customers`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error details:');
      errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    }
    
    // Show final count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM customers WHERE is_active = true');
    console.log(`\n🎉 Total customers in database: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
importCustomers().catch(console.error);
