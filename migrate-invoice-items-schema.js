const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateInvoiceItemsSchema() {
  console.log('🔧 Migrating invoice_items schema: service_id → food_item_id...');
  
  try {
    // 1. Kiểm tra cấu trúc hiện tại
    console.log('📋 Checking current invoice_items structure...');
    const { data: currentItems, error: currentError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1);
      
    if (currentError) {
      console.error('❌ Error fetching current structure:', currentError);
      return;
    }
    
    if (currentItems && currentItems.length > 0) {
      console.log('📋 Current columns:', Object.keys(currentItems[0]));
    }
    
    // 2. Kiểm tra xem có cột food_item_id chưa
    console.log('🔍 Checking if food_item_id column exists...');
    const { data: testData, error: testError } = await supabase
      .from('invoice_items')
      .select('food_item_id')
      .limit(1);
      
    if (testError && testError.message.includes('food_item_id')) {
      console.log('⚠️ food_item_id column does not exist, need to add it');
      
      // Thêm cột food_item_id
      console.log('➕ Adding food_item_id column...');
      // Note: Supabase không hỗ trợ ALTER TABLE qua JavaScript client
      // Cần thực hiện trực tiếp trên Supabase Dashboard hoặc SQL Editor
      console.log('⚠️ Please run this SQL on Supabase Dashboard:');
      console.log('ALTER TABLE invoice_items ADD COLUMN food_item_id INTEGER;');
      console.log('ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES food_items(id);');
      
      // Tạm thời return để user thực hiện SQL
      return;
    } else if (!testError) {
      console.log('✅ food_item_id column already exists');
    }
    
    // 3. Copy dữ liệu từ service_id sang food_item_id (nếu cần)
    console.log('📋 Fetching all invoice_items...');
    const { data: allItems, error: allError } = await supabase
      .from('invoice_items')
      .select('id, service_id, food_item_id');
      
    if (allError) {
      console.error('❌ Error fetching all items:', allError);
      return;
    }
    
    console.log(`📊 Found ${allItems.length} invoice_items`);
    
    // 4. Cập nhật các items có service_id nhưng chưa có food_item_id
    let updateCount = 0;
    for (const item of allItems) {
      if (item.service_id && !item.food_item_id) {
        // Nếu service_id là ID vé buffet (33, 34, 35), copy sang food_item_id
        if ([33, 34, 35].includes(item.service_id)) {
          const { error: updateError } = await supabase
            .from('invoice_items')
            .update({ food_item_id: item.service_id })
            .eq('id', item.id);
            
          if (!updateError) {
            updateCount++;
            console.log(`✅ Updated item ${item.id}: service_id ${item.service_id} → food_item_id ${item.service_id}`);
          } else {
            console.error(`❌ Failed to update item ${item.id}:`, updateError);
          }
        }
      }
    }
    
    console.log(`📊 Updated ${updateCount} items`);
    
    // 5. Xóa cột service_id (tùy chọn)
    console.log('⚠️ To remove service_id column, run this SQL on Supabase Dashboard:');
    console.log('ALTER TABLE invoice_items DROP COLUMN service_id;');
    
    console.log('🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateInvoiceItemsSchema();
