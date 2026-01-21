/**
 * Script cập nhật danh sách nhân viên mới
 * Chạy: node update-employees-list.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm chuyển đổi tên thành username (viết liền, không dấu, không viết hoa)
function toUsername(fullName) {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/\s+/g, '') // Xóa khoảng trắng
    .trim();
}

// Danh sách nhân viên mới
const employees = [
  // TRƯỞNG CA (6 người) - role: 'manager', có quyền POS PC và mobile
  { fullname: 'Nguyễn Ngọc Phương', phone: '0783379364', role: 'manager', department: 'TRƯỞNG CA' },
  { fullname: 'Nguyễn Lâm Gia Hân', phone: '0928328058', role: 'manager', department: 'TRƯỞNG CA' },
  { fullname: 'Thái Bảo Ngọc', phone: '0917636393', role: 'manager', department: 'TRƯỞNG CA' },
  { fullname: 'Đoàn Mỹ Ngọc', phone: '0782943242', role: 'manager', department: 'TRƯỞNG CA' },
  { fullname: 'Nguyễn Duy Uyên', phone: '0933275224', role: 'manager', department: 'TRƯỞNG CA' },
  { fullname: 'Âu Hà Tiến Đạt', phone: '0834181154', role: 'manager', department: 'TRƯỞNG CA' },
  
  // NHÂN VIÊN (19 người) - role: 'staff', chỉ có quyền POS mobile
  { fullname: 'Nguyễn Thị Minh Thư', phone: '0765962933', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Dương Hoàng Tuấn', phone: '0364530240', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Trường Giang', phone: '0914315205', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Võ Yến Ngọc', phone: '0368798948', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Quốc Khánh', phone: '0764461583', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Lê Nguyễn Ánh Đông', phone: '0932822638', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Lê Bùi Gia Yên', phone: '0978252409', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Phan Thị Mỹ Xuyên', phone: '0706556776', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Trần Tiến Bảo', phone: '0767422559', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Huỳnh Đăng Khoa', phone: '0794900719', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Trần Ánh Nhi', phone: '0852484669', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Phạm Quốc Anh', phone: '0772139445', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Tấn Tài', phone: '0384626060', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Phạm Ngọc Nguyên', phone: '0886426441', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Phú Hào', phone: '0898029327', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Quốc Anh', phone: '0399687592', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Lương Thị Huỳnh Trân', phone: '0939784077', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Nguyễn Ánh Hân', phone: '0944659634', role: 'staff', department: 'NHÂN VIÊN' },
  { fullname: 'Huỳnh Viễn Hòa', phone: '0934971516', role: 'staff', department: 'NHÂN VIÊN' }
];

async function updateEmployees() {
  try {
    console.log('🔄 Bắt đầu cập nhật danh sách nhân viên...\n');
    
    // Lấy danh sách admin để giữ lại
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (adminError) {
      console.warn('⚠️  Không thể lấy danh sách admin:', adminError.message);
    } else {
      console.log(`📋 Tìm thấy ${adminUsers?.length || 0} admin - sẽ giữ lại\n`);
    }
    
    // Đánh dấu employees cũ là inactive (không xóa vì có foreign key)
    console.log('🗑️  Đánh dấu nhân viên cũ là inactive...');
    const { error: updateError } = await supabase
      .from('employees')
      .update({ is_active: false })
      .neq('id', 0); // Cập nhật tất cả
    
    if (updateError) {
      console.warn('⚠️  Lỗi cập nhật employees:', updateError.message);
    } else {
      console.log('✅ Đã đánh dấu nhân viên cũ là inactive\n');
    }
    
    // Bỏ qua việc cập nhật users vì có thể không có cột is_active
    
    let successCount = 0;
    let errorCount = 0;
    
    // Import nhân viên mới
    for (const emp of employees) {
      try {
        const username = toUsername(emp.fullname);
        const password = emp.phone; // Mật khẩu = số điện thoại
        
        console.log(`➕ Xử lý: ${emp.fullname} (${emp.department}) - Username: ${username}`);
        
        // Kiểm tra user đã tồn tại chưa
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();
        
        let userId;
        
        if (existingUser) {
          // Cập nhật user đã tồn tại
          const { error: updateUserError } = await supabase
            .from('users')
            .update({
              password: password,
              role: emp.role,
              fullname: emp.fullname // Cập nhật fullname
            })
            .eq('id', existingUser.id);
          
          if (updateUserError) {
            console.error(`   ❌ Lỗi cập nhật user:`, updateUserError.message);
            errorCount++;
            continue;
          }
          
          userId = existingUser.id;
          console.log(`   ✅ Đã cập nhật user`);
        } else {
          // Tạo user mới
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              username: username,
              password: password, // Lưu plain text (sẽ được hash khi login)
              role: emp.role,
              email: null,
              fullname: emp.fullname // Thêm fullname vào users table
            })
            .select('id')
            .single();
          
          if (userError) {
            console.error(`   ❌ Lỗi tạo user:`, userError.message);
            errorCount++;
            continue;
          }
          
          userId = newUser.id;
          console.log(`   ✅ Đã tạo user mới`);
        }
        
        // Kiểm tra employee đã tồn tại chưa
        const { data: existingEmp } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (existingEmp) {
          // Cập nhật employee đã tồn tại
          const { error: empError } = await supabase
            .from('employees')
            .update({
              username: username,
              fullname: emp.fullname,
              phone: emp.phone,
              employee_code: username.toUpperCase(), // Dùng username làm employee_code
              is_active: true
            })
            .eq('id', existingEmp.id);
          
          if (empError) {
            console.error(`   ❌ Lỗi cập nhật employee:`, empError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Đã cập nhật employee`);
            successCount++;
          }
        } else {
          // Tạo employee mới
          const { error: empError } = await supabase
            .from('employees')
            .insert({
              user_id: userId,
              username: username,
              fullname: emp.fullname,
              phone: emp.phone,
              employee_code: username.toUpperCase(), // Dùng username làm employee_code
              hire_date: new Date().toISOString().split('T')[0], // Ngày hiện tại
              is_active: true
            });
          
          if (empError) {
            console.error(`   ❌ Lỗi tạo employee:`, empError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Đã tạo employee mới`);
            successCount++;
          }
        }
      } catch (err) {
        console.error(`   ❌ Lỗi xử lý ${emp.fullname}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Kết quả:');
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Lỗi: ${errorCount}`);
    
    // Hiển thị thống kê
    console.log('\n📋 Thống kê:');
    const managerCount = employees.filter(e => e.role === 'manager').length;
    const staffCount = employees.filter(e => e.role === 'staff').length;
    console.log(`   Trưởng ca: ${managerCount} người`);
    console.log(`   Nhân viên: ${staffCount} người`);
    console.log(`   Admin: ${adminUsers?.length || 0} người (giữ nguyên)`);
    
    console.log('\n✅ Hoàn thành!');
    console.log('\n📝 Lưu ý:');
    console.log('   - Username: họ và tên viết liền không dấu không viết hoa');
    console.log('   - Password: số điện thoại');
    console.log('   - Trưởng ca: có quyền POS PC và mobile');
    console.log('   - Nhân viên: chỉ có quyền POS mobile');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

updateEmployees();

