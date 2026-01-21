const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Thông tin máy in
const PRINTER_IP = '192.168.2.234';
const PRINTER_SUBNET = '192.168.2';
const PRINTER_GATEWAY = '192.168.2.1';

async function getPCNetworkInfo() {
  console.log('🔍 Đang kiểm tra thông tin mạng PC...\n');
  
  try {
    const { stdout } = await execPromise('ipconfig', { timeout: 5000 });
    const lines = stdout.split('\n');
    
    const adapters = [];
    let currentAdapter = null;
    
    lines.forEach(line => {
      // Tìm adapter mới
      if (line.includes('adapter') || line.includes('Adapter')) {
        if (currentAdapter) {
          adapters.push(currentAdapter);
        }
        currentAdapter = {
          name: line.trim(),
          ipv4: null,
          subnet: null,
          gateway: null
        };
      }
      
      // Lấy IPv4
      if (currentAdapter && line.includes('IPv4')) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          currentAdapter.ipv4 = match[1];
          currentAdapter.subnet = match[1].split('.').slice(0, 3).join('.');
        }
      }
      
      // Lấy Subnet Mask
      if (currentAdapter && line.includes('Subnet Mask')) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          currentAdapter.subnetMask = match[1];
        }
      }
      
      // Lấy Default Gateway
      if (currentAdapter && line.includes('Default Gateway')) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          currentAdapter.gateway = match[1];
        }
      }
    });
    
    if (currentAdapter) {
      adapters.push(currentAdapter);
    }
    
    return adapters.filter(a => a.ipv4); // Chỉ lấy adapter có IP
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin mạng:', error.message);
    return [];
  }
}

function analyzeNetwork(adapters) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 PHÂN TÍCH MẠNG');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📍 Thông tin máy in:');
  console.log(`   IP: ${PRINTER_IP}`);
  console.log(`   Subnet: ${PRINTER_SUBNET}.x`);
  console.log(`   Gateway: ${PRINTER_GATEWAY}`);
  console.log(`   Subnet Mask: 255.255.255.0\n`);
  
  if (adapters.length === 0) {
    console.log('❌ Không tìm thấy adapter mạng nào có IP!');
    return;
  }
  
  console.log('💻 Thông tin PC:\n');
  adapters.forEach((adapter, index) => {
    console.log(`${index + 1}. ${adapter.name}`);
    console.log(`   IPv4: ${adapter.ipv4 || 'N/A'}`);
    console.log(`   Subnet: ${adapter.subnet || 'N/A'}.x`);
    console.log(`   Subnet Mask: ${adapter.subnetMask || 'N/A'}`);
    console.log(`   Gateway: ${adapter.gateway || 'N/A'}`);
    
    // So sánh subnet
    if (adapter.subnet === PRINTER_SUBNET) {
      console.log(`   ✅ Cùng subnet với máy in!`);
      console.log(`   → PC và máy in có thể kết nối trực tiếp.`);
    } else {
      console.log(`   ❌ Khác subnet với máy in!`);
      console.log(`   → Cần đổi IP để kết nối.`);
    }
    console.log('');
  });
  
  // Tìm adapter đang active (có gateway)
  const activeAdapter = adapters.find(a => a.gateway);
  
  if (activeAdapter) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 KHUYẾN NGHỊ:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (activeAdapter.subnet === PRINTER_SUBNET) {
      console.log('✅ PC và máy in đã cùng subnet!');
      console.log('   → Bạn có thể kết nối trực tiếp qua IP.');
      console.log('   → Chạy: node check-printer-connection.js để test.\n');
    } else {
      console.log('⚠️  PC và máy in KHÁC subnet!');
      console.log(`   PC subnet: ${activeAdapter.subnet}.x`);
      console.log(`   Máy in subnet: ${PRINTER_SUBNET}.x\n`);
      
      console.log('📋 CÓ 2 CÁCH ĐỂ KẾT NỐI:\n');
      
      console.log('🔧 CÁCH 1: Đổi IP PC (Khuyến nghị - Dễ hơn)');
      console.log('─'.repeat(50));
      console.log(`   Đổi IP PC từ ${activeAdapter.ipv4} thành IP trong subnet ${PRINTER_SUBNET}.x`);
      console.log(`   Ví dụ: ${PRINTER_SUBNET}.100`);
      console.log(`   Subnet Mask: 255.255.255.0`);
      console.log(`   Gateway: ${PRINTER_GATEWAY}\n`);
      console.log('   Xem hướng dẫn chi tiết trong file: HUONG-DAN-DOI-IP-PC.md\n');
      
      console.log('🔧 CÁCH 2: Đổi IP máy in');
      console.log('─'.repeat(50));
      console.log(`   Đổi IP máy in từ ${PRINTER_IP} thành IP trong subnet ${activeAdapter.subnet}.x`);
      console.log(`   Ví dụ: ${activeAdapter.subnet}.234`);
      console.log(`   Subnet Mask: ${activeAdapter.subnetMask || '255.255.255.0'}`);
      console.log(`   Gateway: ${activeAdapter.gateway || 'N/A'}\n`);
      console.log('   Sau đó cập nhật lại IP trong database.\n');
    }
  }
}

async function main() {
  console.log('🚀 KIỂM TRA CẤU HÌNH MẠNG PC VÀ MÁY IN\n');
  
  const adapters = await getPCNetworkInfo();
  analyzeNetwork(adapters);
  
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});















