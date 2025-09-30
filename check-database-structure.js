const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n');

  const tables = [
    'orders',
    'order_items', 
    'order_buffet',
    'buffet_packages',
    'food_items',
    'tables',
    'employees',
    'customers'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': EXISTS (${data.length} sample records)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }

  // Kiểm tra cấu trúc bảng orders
  console.log('\n📋 Checking orders table structure...');
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (!error && data.length > 0) {
      console.log('✅ Orders table columns:', Object.keys(data[0]));
    } else {
      console.log('❌ Cannot read orders table structure');
    }
  } catch (err) {
    console.log('❌ Error checking orders structure:', err.message);
  }

  // Kiểm tra cấu trúc bảng order_items
  console.log('\n📋 Checking order_items table structure...');
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (!error && data.length > 0) {
      console.log('✅ Order_items table columns:', Object.keys(data[0]));
    } else {
      console.log('❌ Cannot read order_items table structure');
    }
  } catch (err) {
    console.log('❌ Error checking order_items structure:', err.message);
  }

  console.log('\n🎯 Database structure check completed!');
}

checkDatabaseStructure().catch(console.error);
