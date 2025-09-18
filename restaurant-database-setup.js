const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupRestaurantDatabase() {
  console.log('🍽️ Starting restaurant database setup...');

  try {
    // 1. Create Restaurant Tables
    console.log('Creating restaurant tables...');
    await pool.query(`
      -- Tables for restaurant management
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(20) UNIQUE NOT NULL,
        table_name VARCHAR(100),
        position_x INTEGER DEFAULT 0,
        position_y INTEGER DEFAULT 0,
        capacity INTEGER DEFAULT 4,
        area VARCHAR(10) DEFAULT 'A',
        status VARCHAR(20) DEFAULT 'empty', -- empty, occupied, reserved, cleaning
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Food categories
      CREATE TABLE IF NOT EXISTS food_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Ingredients/Inventory
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL, -- kg, gram, liter, piece, etc.
        current_stock DECIMAL(10,3) DEFAULT 0,
        min_stock DECIMAL(10,3) DEFAULT 0,
        cost_per_unit DECIMAL(10,2) DEFAULT 0,
        supplier VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Food items (main dishes, sides, combos, toppings)
      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES food_categories(id),
        type VARCHAR(20) NOT NULL, -- main, side, combo, topping
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) DEFAULT 0,
        preparation_time INTEGER DEFAULT 15, -- in minutes
        printer_id INTEGER REFERENCES printers(id),
        is_available BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Recipe ingredients (what ingredients are needed for each food item)
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id SERIAL PRIMARY KEY,
        food_item_id INTEGER NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity DECIMAL(10,3) NOT NULL, -- how much of this ingredient is needed
        unit VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(food_item_id, ingredient_id)
      );

      -- Inventory transactions (in/out stock)
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
        transaction_type VARCHAR(20) NOT NULL, -- in, out, adjustment
        quantity DECIMAL(10,3) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        reason VARCHAR(100), -- purchase, waste, adjustment, etc.
        reference_id INTEGER, -- invoice_id, waste_id, etc.
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Orders (separate from invoices)
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        table_id INTEGER REFERENCES tables(id),
        customer_id INTEGER REFERENCES customers(id),
        employee_id INTEGER REFERENCES employees(id),
        status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, served, cancelled, paid
        order_type VARCHAR(20) DEFAULT 'dine_in', -- dine_in, takeaway, delivery
        subtotal DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50),
        buffet_package_id INTEGER REFERENCES buffet_packages(id),
        buffet_duration_minutes INTEGER,
        buffet_start_time TIMESTAMP,
        buffet_quantity INTEGER DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Order items
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        food_item_id INTEGER NOT NULL REFERENCES food_items(id),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        special_instructions TEXT,
        status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, served
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Kitchen orders (for kitchen display)
      CREATE TABLE IF NOT EXISTS kitchen_orders (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
        food_item_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        table_number VARCHAR(20),
        special_instructions TEXT,
        status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, served
        estimated_time INTEGER, -- in minutes
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Buffet packages
      CREATE TABLE IF NOT EXISTS buffet_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_minutes INTEGER DEFAULT 90,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Buffet package items
      CREATE TABLE IF NOT EXISTS buffet_package_items (
        id SERIAL PRIMARY KEY,
        package_id INTEGER NOT NULL REFERENCES buffet_packages(id) ON DELETE CASCADE,
        food_item_id INTEGER NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
        is_unlimited BOOLEAN DEFAULT TRUE,
        max_quantity INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Printers
      CREATE TABLE IF NOT EXISTS printers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        ip_address VARCHAR(50),
        printer_type VARCHAR(50) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Restaurant tables created.');

    // 2. Create Indexes
    console.log('Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tables_number ON tables (table_number);
      CREATE INDEX IF NOT EXISTS idx_tables_status ON tables (status);
      CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items (category_id);
      CREATE INDEX IF NOT EXISTS idx_food_items_type ON food_items (type);
      CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients (name);
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_food ON recipe_ingredients (food_item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient ON inventory_transactions (ingredient_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions (created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_table ON orders (table_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
      CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders (status);
    `);
    console.log('✅ Indexes created.');

    // 3. Insert sample data
    console.log('Inserting sample data...');
    
    // Food categories
    await pool.query(`
      INSERT INTO food_categories (name, description, sort_order) VALUES
      ('Món Chính', 'Các món ăn chính', 1),
      ('Món Phụ', 'Các món ăn phụ', 2),
      ('Combo', 'Các combo món ăn', 3),
      ('Topping', 'Các topping bổ sung', 4),
      ('Đồ Uống', 'Các loại đồ uống', 5)
      ON CONFLICT DO NOTHING;
    `);

    // Sample tables
    await pool.query(`
      INSERT INTO tables (table_number, table_name, position_x, position_y, capacity, area, status) VALUES
      ('T01', 'Bàn 1', 100, 100, 4, 'A', 'empty'),
      ('T02', 'Bàn 2', 200, 100, 4, 'A', 'empty'),
      ('T03', 'Bàn 3', 300, 100, 6, 'A', 'empty'),
      ('T04', 'Bàn 4', 100, 200, 2, 'B', 'empty'),
      ('T05', 'Bàn 5', 200, 200, 4, 'B', 'empty'),
      ('T06', 'Bàn 6', 300, 200, 8, 'B', 'empty')
      ON CONFLICT (table_number) DO NOTHING;
    `);

    // Sample ingredients
    await pool.query(`
      INSERT INTO ingredients (name, unit, current_stock, min_stock, cost_per_unit, supplier) VALUES
      ('Thịt bò', 'kg', 10.0, 2.0, 250000, 'Nhà cung cấp A'),
      ('Thịt heo', 'kg', 15.0, 3.0, 180000, 'Nhà cung cấp A'),
      ('Gà', 'kg', 8.0, 2.0, 120000, 'Nhà cung cấp B'),
      ('Tôm', 'kg', 5.0, 1.0, 350000, 'Nhà cung cấp C'),
      ('Cá', 'kg', 6.0, 1.5, 200000, 'Nhà cung cấp C'),
      ('Rau xanh', 'kg', 20.0, 5.0, 25000, 'Nhà cung cấp D'),
      ('Gạo', 'kg', 50.0, 10.0, 15000, 'Nhà cung cấp E'),
      ('Mì', 'kg', 30.0, 5.0, 20000, 'Nhà cung cấp E')
      ON CONFLICT DO NOTHING;
    `);

    // Sample food items
    await pool.query(`
      INSERT INTO food_items (name, description, category_id, type, price, cost, preparation_time) VALUES
      ('Cơm tấm sườn nướng', 'Cơm tấm với sườn nướng thơm ngon', 1, 'main', 45000, 25000, 15),
      ('Phở bò', 'Phở bò truyền thống', 1, 'main', 55000, 30000, 10),
      ('Bún bò Huế', 'Bún bò Huế đậm đà', 1, 'main', 50000, 28000, 12),
      ('Gỏi cuốn tôm thịt', 'Gỏi cuốn tươi ngon', 2, 'side', 35000, 20000, 8),
      ('Chả cá Lã Vọng', 'Chả cá đặc sản', 1, 'main', 60000, 35000, 20),
      ('Combo cơm tấm + nước', 'Cơm tấm + nước ngọt', 3, 'combo', 55000, 30000, 15),
      ('Thêm rau', 'Rau xanh bổ sung', 4, 'topping', 10000, 5000, 5),
      ('Thêm thịt', 'Thịt bổ sung', 4, 'topping', 20000, 12000, 5),
      ('Coca Cola', 'Nước ngọt có gas', 5, 'drink', 15000, 8000, 2),
      ('Nước suối', 'Nước suối tinh khiết', 5, 'drink', 10000, 5000, 1)
      ON CONFLICT DO NOTHING;
    `);

    // Sample recipe ingredients
    await pool.query(`
      INSERT INTO recipe_ingredients (food_item_id, ingredient_id, quantity, unit) VALUES
      (1, 1, 0.15, 'kg'), -- Cơm tấm sườn nướng: 150g thịt bò
      (1, 6, 0.2, 'kg'),  -- + 200g rau xanh
      (1, 7, 0.2, 'kg'),  -- + 200g gạo
      (2, 1, 0.1, 'kg'),  -- Phở bò: 100g thịt bò
      (2, 6, 0.1, 'kg'),  -- + 100g rau xanh
      (2, 8, 0.15, 'kg'), -- + 150g mì
      (3, 1, 0.12, 'kg'), -- Bún bò Huế: 120g thịt bò
      (3, 6, 0.15, 'kg'), -- + 150g rau xanh
      (3, 8, 0.2, 'kg'),  -- + 200g mì
      (4, 2, 0.08, 'kg'), -- Gỏi cuốn: 80g thịt heo
      (4, 4, 0.1, 'kg'),  -- + 100g tôm
      (4, 6, 0.1, 'kg'),  -- + 100g rau xanh
      (5, 5, 0.2, 'kg'),  -- Chả cá: 200g cá
      (5, 6, 0.1, 'kg'),  -- + 100g rau xanh
      (6, 1, 0.15, 'kg'), -- Combo: 150g thịt bò
      (6, 6, 0.2, 'kg'),  -- + 200g rau xanh
      (6, 7, 0.2, 'kg'),  -- + 200g gạo
      (7, 6, 0.05, 'kg'), -- Thêm rau: 50g rau xanh
      (8, 1, 0.08, 'kg')  -- Thêm thịt: 80g thịt bò
      ON CONFLICT DO NOTHING;
    `);

    // Sample printers
    await pool.query(`
      INSERT INTO printers (name, location, ip_address, printer_type) VALUES
      ('Máy in Bếp Chính', 'Bếp chính', '192.168.1.10', 'kitchen'),
      ('Máy in Bar', 'Quầy bar', '192.168.1.11', 'bar'),
      ('Máy in Tổng', 'Thu ngân', '192.168.1.12', 'general')
      ON CONFLICT DO NOTHING;
    `);

    // Sample buffet packages
    await pool.query(`
      INSERT INTO buffet_packages (name, description, price, duration_minutes) VALUES
      ('Buffet Cơ Bản', 'Buffet với các món ăn cơ bản', 199000, 90),
      ('Buffet Cao Cấp', 'Buffet với các món ăn cao cấp', 299000, 120),
      ('Buffet Trẻ Em', 'Buffet dành cho trẻ em dưới 12 tuổi', 149000, 90)
      ON CONFLICT DO NOTHING;
    `);

    // Sample buffet package items - using actual package IDs
    const packageResult = await pool.query('SELECT id, name FROM buffet_packages ORDER BY id');
    const packages = packageResult.rows;
    console.log('Available packages:', packages.map(p => `${p.id}: ${p.name}`));
    
    // Only add items if we have food_items
    const foodResult = await pool.query('SELECT id, name FROM food_items ORDER BY id LIMIT 10');
    if (foodResult.rows.length > 0) {
      console.log('Available food items:', foodResult.rows.map(f => `${f.id}: ${f.name}`));
      
      // Find the packages we just created
      const basicPackage = packages.find(p => p.name === 'Buffet Cơ Bản');
      const premiumPackage = packages.find(p => p.name === 'Buffet Cao Cấp');
      const kidsPackage = packages.find(p => p.name === 'Buffet Trẻ Em');
      
      if (basicPackage && premiumPackage && kidsPackage && foodResult.rows.length >= 3) {
        await pool.query(`
          INSERT INTO buffet_package_items (package_id, food_item_id, is_unlimited, max_quantity) VALUES
          ($1, $2, true, NULL),   -- Buffet Cơ Bản: first food item
          ($1, $3, true, NULL),   -- Buffet Cơ Bản: second food item
          ($4, $2, true, NULL),   -- Buffet Cao Cấp: first food item
          ($4, $3, true, NULL),   -- Buffet Cao Cấp: second food item
          ($4, $5, true, NULL),   -- Buffet Cao Cấp: third food item
          ($6, $2, false, 1),     -- Buffet Trẻ Em: first food item max 1
          ($6, $3, false, 2)      -- Buffet Trẻ Em: second food item max 2
          ON CONFLICT DO NOTHING;
        `, [
          basicPackage.id, foodResult.rows[0].id, foodResult.rows[1].id,
          premiumPackage.id, foodResult.rows[2] ? foodResult.rows[2].id : foodResult.rows[0].id,
          kidsPackage.id
        ]);
        console.log('✅ Buffet package items added');
      } else {
        console.log('ℹ️  Skipping buffet package items - missing packages or food items');
      }
    } else {
      console.log('ℹ️  No food items found, skipping buffet package items');
    }

    console.log('✅ Sample data inserted.');

    console.log('🎉 Restaurant database setup completed successfully!');
    console.log('');
    console.log('📋 Restaurant Features Added:');
    console.log('✅ Table Management - Drag & drop table layout');
    console.log('✅ Food Categories - Main, Side, Combo, Topping, Drinks');
    console.log('✅ Inventory Management - Ingredients with stock tracking');
    console.log('✅ Recipe Management - Ingredient requirements per dish');
    console.log('✅ Order System - Separate orders from invoices');
    console.log('✅ Kitchen Display - Order management for kitchen');
    console.log('');
    console.log('🍽️ Sample Data:');
    console.log('- 6 tables with different capacities');
    console.log('- 8 ingredients with stock levels');
    console.log('- 10 food items across all categories');
    console.log('- Recipe ingredients for each dish');

  } catch (err) {
    console.error('❌ Restaurant database setup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupRestaurantDatabase();

