// Kiểm tra kết nối tới bảng tables trong Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Lỗi: Thiếu thông tin Supabase trong file .env');
  console.error('   Cần có: REACT_APP_SUPABASE_URL và REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Tạo client với anon key (mặc định)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tạo client với service_role key (nếu có, để bypass RLS)
let supabaseService = null;
if (supabaseServiceKey) {
  supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Đã tạo client với service_role key (có thể bypass RLS)\n');
}

async function checkTablesConnection() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     KIỂM TRA KẾT NỐI TỚI BẢNG TABLES                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📡 Thông tin kết nối:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 30)}...`);
  if (supabaseServiceKey) {
    console.log(`   Service Key: ${supabaseServiceKey.substring(0, 30)}... (có sẵn)`);
  }
  console.log();
  
  // 1. Kiểm tra kết nối cơ bản
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Bước 1: Kiểm tra kết nối Supabase...\n');
  
  // Thử kết nối với bảng 'tables' (tên bảng chính thức trong code)
  const tableName = 'tables';
  let connectionSuccess = false;
  let useServiceKey = false;
  
  // Thử với anon key trước
  try {
    const { data, error: testError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!testError) {
      connectionSuccess = true;
      console.log(`✅ Kết nối Supabase thành công (với anon key)!`);
      console.log(`✅ Bảng "${tableName}" tồn tại và có thể truy cập\n`);
    } else {
      console.log(`⚠️  Bảng "${tableName}" có vấn đề với anon key:`);
      console.log(`   Message: ${testError.message}`);
      console.log(`   Code: ${testError.code}`);
      console.log(`   Details: ${testError.details || 'N/A'}`);
      console.log(`   Hint: ${testError.hint || 'N/A'}`);
      
      if (testError.code === 'PGRST205') {
        console.log('\n❌ Bảng "tables" không tồn tại trong database!');
        console.log('   💡 Cần tạo bảng "tables" trong Supabase');
        console.log('   💡 Hoặc kiểm tra lại tên bảng trong database\n');
        return;
      } else if (testError.code === 'PGRST301' || testError.message.includes('permission denied')) {
        console.log('\n⚠️  Cảnh báo: RLS (Row Level Security) đang BẬT!');
        console.log('   💡 Thử với service_role key để bypass RLS...\n');
        
        // Thử với service_role key nếu có
        if (supabaseService) {
          try {
            const { data: serviceData, error: serviceError } = await supabaseService
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!serviceError) {
              connectionSuccess = true;
              useServiceKey = true;
              console.log(`✅ Kết nối thành công với service_role key!`);
              console.log(`✅ Bảng "${tableName}" tồn tại và có thể truy cập (bypass RLS)\n`);
            } else {
              console.log(`❌ Vẫn lỗi với service_role key:`);
              console.log(`   ${serviceError.message}\n`);
              return;
            }
          } catch (serviceErr) {
            console.log(`❌ Lỗi exception với service_role key:`);
            console.log(`   ${serviceErr.message}\n`);
            return;
          }
        } else {
          console.log('   ⚠️  Không có service_role key để thử\n');
          return;
        }
      } else {
        console.log('\n⚠️  Có lỗi khác khi truy cập bảng\n');
        return;
      }
    }
  } catch (error) {
    console.log(`❌ Lỗi exception khi kiểm tra kết nối:`);
    console.log(`   ${error.message}\n`);
    return;
  }
  
  // Sử dụng client phù hợp cho các bước tiếp theo
  const activeSupabase = useServiceKey ? supabaseService : supabase;
  
  // 2. Đếm số lượng bàn
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Bước 2: Đếm số lượng bàn...\n');
  
  try {
    const { count, error: countError } = await activeSupabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Lỗi đếm số lượng:');
      console.log(`   ${countError.message}\n`);
    } else {
      console.log(`✅ Tổng số bàn: ${count || 0}\n`);
    }
  } catch (error) {
    console.log(`❌ Lỗi exception: ${error.message}\n`);
  }
  
  // 3. Lấy danh sách bàn (giới hạn 10 bàn đầu tiên)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Bước 3: Lấy danh sách bàn...\n');
  
  try {
    const { data: tables, error: tablesError } = await activeSupabase
      .from(tableName)
      .select('*')
      .limit(10)
      .order('id', { ascending: true });
    
    if (tablesError) {
      console.log('❌ Lỗi lấy danh sách:');
      console.log(`   ${tablesError.message}\n`);
    } else {
      if (!tables || tables.length === 0) {
        console.log('⚠️  Không có bàn nào trong database\n');
      } else {
        console.log(`✅ Tìm thấy ${tables.length} bàn:\n`);
        console.log('📋 Danh sách bàn:');
        console.log('─'.repeat(80));
        
        tables.forEach((table, index) => {
          console.log(`\n${index + 1}. Bàn ID: ${table.id}`);
          console.log(`   Tên bàn: ${table.table_name || 'N/A'}`);
          console.log(`   Số bàn: ${table.table_number || 'N/A'}`);
          console.log(`   Khu vực: ${table.area || 'N/A'}`);
          console.log(`   Sức chứa: ${table.capacity || 'N/A'}`);
          console.log(`   Trạng thái: ${table.status || 'N/A'}`);
          console.log(`   Tạo lúc: ${table.created_at || 'N/A'}`);
        });
        
        console.log('\n' + '─'.repeat(80));
      }
    }
  } catch (error) {
    console.log(`❌ Lỗi exception: ${error.message}\n`);
  }
  
  // 4. Kiểm tra cấu trúc bảng (lấy 1 bàn để xem các cột)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Bước 4: Kiểm tra cấu trúc bảng...\n');
  
  try {
    const { data: sampleTable, error: sampleError } = await activeSupabase
      .from(tableName)
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      if (sampleError.code === 'PGRST116') {
        console.log('⚠️  Không có dữ liệu mẫu để kiểm tra cấu trúc\n');
      } else {
        console.log('❌ Lỗi lấy mẫu:');
        console.log(`   ${sampleError.message}\n`);
      }
    } else {
      console.log(`✅ Cấu trúc bảng "${tableName}":\n`);
      console.log('📊 Các cột có trong bảng:');
      Object.keys(sampleTable).forEach((key, index) => {
        const value = sampleTable[key];
        const type = typeof value;
        const valuePreview = value !== null && value !== undefined 
          ? (typeof value === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : String(value))
          : 'null';
        console.log(`   ${index + 1}. ${key} (${type}): ${valuePreview}`);
      });
      console.log();
    }
  } catch (error) {
    console.log(`❌ Lỗi exception: ${error.message}\n`);
  }
  
  // 5. Tổng kết
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Hoàn tất kiểm tra kết nối!\n');
}

// Chạy kiểm tra
checkTablesConnection()
  .then(() => {
    console.log('🎉 Script đã chạy xong!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi không mong đợi:');
    console.error(error);
    process.exit(1);
  });

