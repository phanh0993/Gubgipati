const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createSimpleTables() {
  const client = await pool.connect();
  try {
    console.log('🗑️ Xóa bảng cũ nếu có...');
    await client.query('DROP TABLE IF EXISTS tables CASCADE');
    
    console.log('📋 Tạo bảng tables đơn giản...');
    await client.query(`
      CREATE TABLE tables (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(10) UNIQUE NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        area VARCHAR(1) NOT NULL CHECK (area IN ('A', 'B', 'C', 'D')),
        capacity INTEGER DEFAULT 4,
        status VARCHAR(20) DEFAULT 'empty' CHECK (status IN ('empty', 'busy')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tạo bảng thành công!');
    
    console.log('📊 Thêm dữ liệu mẫu...');
    const sampleTables = [
      { table_number: 'A1', table_name: 'Bàn A1', area: 'A', capacity: 4 },
      { table_number: 'A2', table_name: 'Bàn A2', area: 'A', capacity: 4 },
      { table_number: 'A3', table_name: 'Bàn A3', area: 'A', capacity: 6 },
      { table_number: 'B1', table_name: 'Bàn B1', area: 'B', capacity: 4 },
      { table_number: 'B2', table_name: 'Bàn B2', area: 'B', capacity: 4 },
      { table_number: 'B3', table_name: 'Bàn B3', area: 'B', capacity: 8 },
      { table_number: 'C1', table_name: 'Bàn C1', area: 'C', capacity: 4 },
      { table_number: 'C2', table_name: 'Bàn C2', area: 'C', capacity: 4 },
      { table_number: 'D1', table_name: 'Bàn D1', area: 'D', capacity: 4 },
      { table_number: 'D2', table_name: 'Bàn D2', area: 'D', capacity: 6 }
    ];
    
    for (const table of sampleTables) {
      await client.query(`
        INSERT INTO tables (table_number, table_name, area, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [table.table_number, table.table_name, table.area, table.capacity, 'empty']);
    }
    
    console.log('✅ Thêm dữ liệu mẫu thành công!');
    
    // Kiểm tra kết quả
    const result = await client.query('SELECT * FROM tables ORDER BY area, table_number');
    console.log('📋 Danh sách bàn:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createSimpleTables();

