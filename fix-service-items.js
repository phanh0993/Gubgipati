// Script để sửa món dịch vụ
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixServiceItems() {
  console.log('🔄 Bắt đầu sửa món dịch vụ...\n');
  
  // 1. Kiểm tra và thêm "NƯỚC" vào COMBO nếu chưa có
  console.log('🔍 Kiểm tra món "NƯỚC" trong COMBO...');
  const { data: existingNuoc, error: checkNuocError } = await supabase
    .from('food_items')
    .select('*')
    .eq('name', 'NƯỚC')
    .eq('type', 'COMBO')
    .maybeSingle();
  
  if (checkNuocError) {
    console.error('❌ Lỗi kiểm tra:', checkNuocError);
    return;
  }
  
  if (!existingNuoc) {
    console.log('➕ Thêm món "NƯỚC" vào COMBO...');
    const { data: newItem, error: insertError } = await supabase
      .from('food_items')
      .insert({
        name: 'NƯỚC',
        price: 19000,
        type: 'COMBO',
        description: ''
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Lỗi thêm món:', insertError);
      return;
    }
    console.log('✅ Đã thêm món "NƯỚC" vào COMBO\n');
  } else {
    console.log('✅ Món "NƯỚC" đã có trong COMBO\n');
    
    // Kiểm tra giá có đúng không
    if (existingNuoc.price !== 19000) {
      console.log('🔧 Sửa giá "NƯỚC" từ', existingNuoc.price, 'thành 19000...');
      const { error: updateError } = await supabase
        .from('food_items')
        .update({ price: 19000 })
        .eq('id', existingNuoc.id);
      
      if (updateError) {
        console.error('❌ Lỗi sửa giá:', updateError);
        return;
      }
      console.log('✅ Đã sửa giá "NƯỚC"\n');
    }
  }
  
  // 2. Kiểm tra và thêm "Tráng miệng" vào COMBO nếu chưa có
  console.log('🔍 Kiểm tra món "Tráng miệng" trong COMBO...');
  const { data: existingDessert, error: checkError } = await supabase
    .from('food_items')
    .select('*')
    .eq('name', 'Tráng miệng')
    .eq('type', 'COMBO')
    .maybeSingle();
  
  if (checkError) {
    console.error('❌ Lỗi kiểm tra:', checkError);
    return;
  }
  
  if (!existingDessert) {
    console.log('➕ Thêm món "Tráng miệng" vào COMBO...');
    const { data: newItem, error: insertError } = await supabase
      .from('food_items')
      .insert({
        name: 'Tráng miệng',
        price: 25000,
        type: 'COMBO',
        description: ''
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Lỗi thêm món:', insertError);
      return;
    }
    console.log('✅ Đã thêm món "Tráng miệng" vào COMBO\n');
  } else {
    console.log('✅ Món "Tráng miệng" đã có trong COMBO\n');
    
    // Kiểm tra giá có đúng không
    if (existingDessert.price !== 25000) {
      console.log('🔧 Sửa giá "Tráng miệng" từ', existingDessert.price, 'thành 25000...');
      const { error: updateError } = await supabase
        .from('food_items')
        .update({ price: 25000 })
        .eq('id', existingDessert.id);
      
      if (updateError) {
        console.error('❌ Lỗi sửa giá:', updateError);
        return;
      }
      console.log('✅ Đã sửa giá "Tráng miệng"\n');
    }
  }
  
  // 3. Sửa giá "2 Cấp" từ 30000 thành 60000
  console.log('🔧 Sửa giá "2 Cấp" từ 30000 thành 60000...');
  const { data: upVe2Cap, error: findError } = await supabase
    .from('food_items')
    .select('*')
    .eq('name', '2 Cấp')
    .eq('type', 'UP VÉ')
    .maybeSingle();
  
  if (findError) {
    console.error('❌ Lỗi tìm món:', findError);
    return;
  }
  
  if (!upVe2Cap) {
    console.error('❌ Không tìm thấy món "2 Cấp" trong UP VÉ');
    return;
  }
  
  if (upVe2Cap.price !== 60000) {
    const { error: updateError } = await supabase
      .from('food_items')
      .update({ price: 60000 })
      .eq('id', upVe2Cap.id);
    
    if (updateError) {
      console.error('❌ Lỗi sửa giá:', updateError);
      return;
    }
    console.log(`✅ Đã sửa giá "2 Cấp" từ ${upVe2Cap.price} thành 60000\n`);
  } else {
    console.log('✅ Giá "2 Cấp" đã đúng (60000)\n');
  }
  
  // 3. Hiển thị danh sách cuối cùng
  console.log('📋 Danh sách món dịch vụ sau khi sửa:');
  const { data: allServiceItems, error: fetchError } = await supabase
    .from('food_items')
    .select('*')
    .in('type', ['COMBO', 'KHÔNG CỒN', 'CÓ CỒN', 'MÓN LẺ', 'VÉ TRẺ EM', 'UP VÉ'])
    .order('type', { ascending: true })
    .order('name', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Lỗi lấy danh sách:', fetchError);
    return;
  }
  
  const types = ['COMBO', 'KHÔNG CỒN', 'CÓ CỒN', 'MÓN LẺ', 'VÉ TRẺ EM', 'UP VÉ'];
  for (const type of types) {
    const items = allServiceItems.filter(item => item.type === type);
    if (items.length > 0) {
      console.log(`\n${type}:`);
      items.forEach(item => {
        console.log(`  - ${item.name}: ${item.price.toLocaleString('vi-VN')}₫`);
      });
    }
  }
  
  console.log('\n✅ Hoàn tất sửa món dịch vụ!');
}

fixServiceItems().catch(console.error);

