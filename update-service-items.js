// Script để cập nhật danh sách món dịch vụ mới
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách món dịch vụ mới từ ảnh 1
const serviceItems = [
  // KHÔNG CỒN
  { name: 'NƯỚC', price: 19000, type: 'KHÔNG CỒN' },
  { name: 'Nước suối', price: 15000, type: 'KHÔNG CỒN' },
  { name: 'Pepsi', price: 15000, type: 'KHÔNG CỒN' },
  { name: 'Sting', price: 15000, type: 'KHÔNG CỒN' },
  
  // CÓ CỒN
  { name: 'Rượu Soju', price: 79000, type: 'CÓ CỒN' },
  { name: 'Rượu gạo nhỏ', price: 59000, type: 'CÓ CỒN' },
  { name: 'Rượu gạo lớn', price: 89000, type: 'CÓ CỒN' },
  { name: 'Bia Tiger bạc', price: 23000, type: 'CÓ CỒN' },
  { name: 'Bia Tiger nâu', price: 21000, type: 'CÓ CỒN' },
  
  // COMBO
  { name: 'NƯỚC', price: 19000, type: 'COMBO' },
  { name: 'Tráng miệng', price: 25000, type: 'COMBO' },
  { name: 'COMBO NƯỚC + TRÁNG MIỆNG', price: 35000, type: 'COMBO' },
  
  // MÓN LẺ
  { name: 'Sụ gà Gubgi', price: 59000, type: 'MÓN LẺ' },
  { name: 'Tủy bò nướng bánh mì bơ tỏi', price: 59000, type: 'MÓN LẺ' },
  { name: 'Rong biển', price: 9000, type: 'MÓN LẺ' },
  { name: 'Khăn lạnh', price: 9000, type: 'MÓN LẺ' },
  
  // VÉ TRẺ EM
  { name: '169K', price: 84500, type: 'VÉ TRẺ EM' },
  { name: '199K', price: 99500, type: 'VÉ TRẺ EM' },
  { name: '229K', price: 114500, type: 'VÉ TRẺ EM' },
  
  // UP VÉ
  { name: '1 Cấp', price: 30000, type: 'UP VÉ' },
  { name: '2 Cấp', price: 60000, type: 'UP VÉ' },
];

async function updateServiceItems() {
  console.log('🔄 Bắt đầu cập nhật danh sách món dịch vụ...\n');
  
  // 1. Update các món dịch vụ cũ (type = 'service') thành is_active = false
  console.log('🗑️  Vô hiệu hóa các món dịch vụ cũ...');
  const { error: updateError } = await supabase
    .from('food_items')
    .update({ is_active: false })
    .eq('type', 'service');
  
  if (updateError) {
    console.warn('⚠️  Lỗi vô hiệu hóa món cũ:', updateError);
  } else {
    console.log('✅ Đã vô hiệu hóa món dịch vụ cũ\n');
  }
  
  // 2. Thêm các món dịch vụ mới
  console.log('➕ Thêm các món dịch vụ mới...');
  const itemsToInsert = serviceItems.map(item => ({
    name: item.name,
    price: item.price,
    type: item.type, // Dùng type làm đầu mục
    description: ''
  }));
  
  const { data, error: insertError } = await supabase
    .from('food_items')
    .insert(itemsToInsert)
    .select();
  
  if (insertError) {
    console.error('❌ Lỗi thêm món mới:', insertError);
    return;
  }
  
  console.log(`✅ Đã thêm ${data.length} món dịch vụ mới\n`);
  
  // 3. Hiển thị danh sách theo từng đầu mục
  console.log('📋 Danh sách món dịch vụ theo đầu mục:');
  const types = ['COMBO', 'KHÔNG CỒN', 'CÓ CỒN', 'MÓN LẺ', 'VÉ TRẺ EM', 'UP VÉ'];
  
  for (const type of types) {
    const items = serviceItems.filter(item => item.type === type);
    console.log(`\n${type}:`);
    items.forEach(item => {
      console.log(`  - ${item.name}: ${item.price.toLocaleString('vi-VN')}₫`);
    });
  }
  
  console.log('\n✅ Hoàn tất cập nhật danh sách món dịch vụ!');
}

updateServiceItems().catch(console.error);

