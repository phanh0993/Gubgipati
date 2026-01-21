// Script cập nhật cấu hình Supabase mới
const fs = require('fs');
const path = require('path');

const newConfig = {
  SUPABASE_URL: 'https://yydxhcvxkmxbohqtbbvw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDM3NjAsImV4cCI6MjA3MzU3OTc2MH0.rVZq_iqRTUAiAu_FH1Qk7XzWurM1XsMVlgwaUjXT6Kk',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs',
  REACT_APP_SUPABASE_URL: 'https://yydxhcvxkmxbohqtbbvw.supabase.co',
  REACT_APP_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDM3NjAsImV4cCI6MjA3MzU3OTc2MH0.rVZq_iqRTUAiAu_FH1Qk7XzWurM1XsMVlgwaUjXT6Kk'
};

const envPath = path.join(__dirname, '.env');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     CẬP NHẬT CẤU HÌNH SUPABASE MỚI                   ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Đọc file .env hiện tại
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Đã đọc file .env hiện tại\n');
} else {
  console.log('⚠️  File .env không tồn tại, sẽ tạo mới\n');
  // Tạo nội dung mặc định
  envContent = `# Database Configuration
DATABASE_URL=

# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Server Configuration
PORT=8000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here

# Client Configuration
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_URL=
`;
}

// Cập nhật các giá trị
console.log('🔄 Đang cập nhật các giá trị...\n');

Object.keys(newConfig).forEach(key => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${newConfig[key]}`;
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine);
    console.log(`✅ Đã cập nhật: ${key}`);
  } else {
    // Thêm vào cuối file nếu chưa có
    envContent += `\n${newLine}`;
    console.log(`➕ Đã thêm: ${key}`);
  }
});

// Ghi lại file .env
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n✅ Đã cập nhật file .env thành công!\n');
console.log('📋 Thông tin mới:');
console.log(`   URL: ${newConfig.SUPABASE_URL}`);
console.log(`   Anon Key: ${newConfig.SUPABASE_ANON_KEY.substring(0, 30)}...`);
console.log(`   Service Key: ${newConfig.SUPABASE_SERVICE_KEY.substring(0, 30)}...`);
console.log('\n💡 Bây giờ bạn có thể chạy lại script kiểm tra kết nối!');







