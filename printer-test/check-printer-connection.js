const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Thông tin máy in QUAY BARR
const PRINTER_IP = '192.168.1.234'; // Đã đổi từ 192.168.2.234
const PRINTER_PORT = 9100;
const PRINTER_NAME = 'QUAY BARR';

// Test ping
async function testPing(ip) {
  console.log(`\n📡 Bước 1: Kiểm tra Ping tới ${ip}...`);
  console.log('─'.repeat(50));
  
  try {
    // Sử dụng PowerShell Test-Connection cho Windows
    const { stdout, stderr } = await execPromise(`powershell -Command "Test-Connection -ComputerName ${ip} -Count 4 -ErrorAction SilentlyContinue | Select-Object -Property Address,Status,ResponseTime"`, { timeout: 15000 });
    
    if (stdout.includes('Success') || stdout.includes('Address') || stdout.includes(ip)) {
      console.log(`✅ Ping thành công! Máy in ${ip} đang online.`);
      console.log('\n📋 Chi tiết ping:');
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('---'));
      lines.forEach(line => {
        if (line.trim()) console.log(`   ${line.trim()}`);
      });
      return true;
    } else {
      // Thử ping truyền thống nếu PowerShell không hoạt động
      try {
        const { stdout: pingOut } = await execPromise(`ping -n 4 ${ip}`, { timeout: 10000 });
        if (pingOut.includes('TTL=') || pingOut.includes('Reply from') || pingOut.includes('Reply')) {
          console.log(`✅ Ping thành công! Máy in ${ip} đang online.`);
          console.log('\n📋 Chi tiết ping:');
          const lines = pingOut.split('\n').filter(line => line.trim());
          lines.slice(0, 6).forEach(line => console.log(`   ${line}`));
          return true;
        } else {
          console.log(`❌ Ping thất bại! Không thể kết nối tới ${ip}.`);
          return false;
        }
      } catch (pingError) {
        console.log(`❌ Ping thất bại! Không thể kết nối tới ${ip}.`);
        console.log(`   Lỗi: ${pingError.message}`);
        return false;
      }
    }
  } catch (error) {
    // Thử ping truyền thống
    try {
      const { stdout: pingOut } = await execPromise(`ping -n 4 ${ip}`, { timeout: 10000 });
      if (pingOut.includes('TTL=') || pingOut.includes('Reply from') || pingOut.includes('Reply')) {
        console.log(`✅ Ping thành công! Máy in ${ip} đang online.`);
        console.log('\n📋 Chi tiết ping:');
        const lines = pingOut.split('\n').filter(line => line.trim());
        lines.slice(0, 6).forEach(line => console.log(`   ${line}`));
        return true;
      } else {
        console.log(`❌ Ping thất bại! Không thể kết nối tới ${ip}.`);
        return false;
      }
    } catch (pingError) {
      console.log(`❌ Lỗi khi ping: ${error.message}`);
      return false;
    }
  }
}

// Test port connection
async function testPortConnection(ip, port, timeout = 5000) {
  console.log(`\n🔌 Bước 2: Kiểm tra kết nối TCP tới ${ip}:${port}...`);
  console.log('─'.repeat(50));
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    let connected = false;
    
    client.setTimeout(timeout);
    
    client.connect(port, ip, () => {
      connected = true;
      console.log(`✅ Kết nối TCP thành công tới ${ip}:${port}!`);
      console.log(`   Port ${port} đang mở và sẵn sàng nhận kết nối.`);
      client.destroy();
      resolve({ success: true, message: 'Connected' });
    });
    
    client.on('error', (err) => {
      if (!connected) {
        console.log(`❌ Không thể kết nối TCP tới ${ip}:${port}`);
        console.log(`   Lỗi: ${err.message}`);
        
        if (err.code === 'ECONNREFUSED') {
          console.log(`   💡 Port ${port} bị từ chối - có thể máy in chưa bật hoặc port chưa mở.`);
        } else if (err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH') {
          console.log(`   💡 Không thể tìm thấy máy chủ - kiểm tra IP address và mạng.`);
        } else if (err.code === 'ENETUNREACH') {
          console.log(`   💡 Mạng không thể truy cập - kiểm tra kết nối mạng.`);
        }
        
        resolve({ success: false, error: err.message, code: err.code });
      }
    });
    
    client.on('timeout', () => {
      if (!connected) {
        console.log(`⏱️  Timeout khi kết nối tới ${ip}:${port} (${timeout}ms)`);
        console.log(`   💡 Máy in có thể đang tắt hoặc không phản hồi.`);
        client.destroy();
        resolve({ success: false, error: 'Timeout', code: 'ETIMEDOUT' });
      }
    });
  });
}

// Test telnet (alternative method)
async function testTelnet(ip, port) {
  console.log(`\n🔍 Bước 3: Kiểm tra bằng Telnet (nếu có)...`);
  console.log('─'.repeat(50));
  
  try {
    const { stdout, stderr } = await execPromise(`powershell -Command "Test-NetConnection -ComputerName ${ip} -Port ${port} -InformationLevel Detailed"`, { timeout: 10000 });
    
    if (stdout.includes('TcpTestSucceeded : True')) {
      console.log(`✅ Telnet test thành công!`);
      console.log('\n📋 Chi tiết:');
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('---'));
      lines.forEach(line => {
        if (line.includes('TcpTestSucceeded') || line.includes('RemoteAddress') || line.includes('RemotePort')) {
          console.log(`   ${line.trim()}`);
        }
      });
      return true;
    } else {
      console.log(`❌ Telnet test thất bại.`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Không thể chạy telnet test (có thể do PowerShell): ${error.message}`);
    console.log(`   Bạn có thể test thủ công bằng lệnh:`);
    console.log(`   telnet ${ip} ${port}`);
    return false;
  }
}

// Kiểm tra mạng hiện tại
async function checkNetworkInfo() {
  console.log(`\n🌐 Bước 4: Kiểm tra thông tin mạng PC...`);
  console.log('─'.repeat(50));
  
  try {
    const { stdout } = await execPromise('ipconfig', { timeout: 5000 });
    const lines = stdout.split('\n');
    
    console.log('📋 Thông tin mạng PC:');
    let inAdapter = false;
    let adapterName = '';
    
    lines.forEach(line => {
      if (line.includes('adapter') || line.includes('Adapter')) {
        inAdapter = true;
        adapterName = line.trim();
      } else if (line.trim() === '') {
        inAdapter = false;
      } else if (inAdapter && (line.includes('IPv4') || line.includes('Subnet') || line.includes('Gateway'))) {
        console.log(`   ${adapterName}`);
        console.log(`   ${line.trim()}`);
        adapterName = '';
      }
    });
    
    // Kiểm tra xem IP máy in có cùng subnet không
    const ipv4Match = stdout.match(/IPv4.*?(\d+\.\d+\.\d+\.\d+)/);
    if (ipv4Match) {
      const pcIP = ipv4Match[1];
      const pcSubnet = pcIP.split('.').slice(0, 3).join('.');
      const printerSubnet = PRINTER_IP.split('.').slice(0, 3).join('.');
      
      console.log(`\n🔍 Phân tích subnet:`);
      console.log(`   PC IP: ${pcIP} (subnet: ${pcSubnet}.x)`);
      console.log(`   Máy in IP: ${PRINTER_IP} (subnet: ${printerSubnet}.x)`);
      
      if (pcSubnet !== printerSubnet) {
        console.log(`   ⚠️  CẢNH BÁO: PC và máy in KHÔNG cùng subnet!`);
        console.log(`   💡 Máy in có thể ở mạng khác hoặc cần router để kết nối.`);
      } else {
        console.log(`   ✅ PC và máy in cùng subnet.`);
      }
    }
    
  } catch (error) {
    console.log(`⚠️  Không thể lấy thông tin mạng: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🔧 KIỂM TRA KẾT NỐI MÁY IN: ${PRINTER_NAME}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 IP: ${PRINTER_IP}`);
  console.log(`🔌 Port: ${PRINTER_PORT}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Bước 1: Ping
  const pingResult = await testPing(PRINTER_IP);
  
  // Bước 2: Test port
  const portResult = await testPortConnection(PRINTER_IP, PRINTER_PORT);
  
  // Bước 3: Telnet test
  await testTelnet(PRINTER_IP, PRINTER_PORT);
  
  // Bước 4: Network info
  await checkNetworkInfo();
  
  // Tổng kết
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TỔNG KẾT:');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (pingResult && portResult.success) {
    console.log('✅ Máy in hoạt động bình thường!');
    console.log('   - Ping: OK');
    console.log('   - Port 9100: OK');
    console.log('   → Máy in sẵn sàng để in.');
  } else if (pingResult && !portResult.success) {
    console.log('⚠️  Máy in online nhưng port không mở!');
    console.log('   - Ping: OK');
    console.log('   - Port 9100: FAILED');
    console.log('   💡 Kiểm tra:');
    console.log('      1. Máy in có hỗ trợ raw printing không?');
    console.log('      2. Port 9100 có bị tắt trong cài đặt máy in không?');
    console.log('      3. Firewall trên máy in có chặn port 9100 không?');
  } else if (!pingResult) {
    console.log('❌ Không thể kết nối tới máy in!');
    console.log('   - Ping: FAILED');
    console.log('   💡 Kiểm tra:');
    console.log('      1. Máy in đã được bật chưa?');
    console.log('      2. IP address có đúng không? (192.168.2.234)');
    console.log('      3. Máy in và PC có cùng mạng LAN không?');
    console.log('      4. Cáp mạng/WiFi có kết nối không?');
    console.log('      5. Router có chặn giao tiếp giữa các thiết bị không?');
  }
  
  console.log('\n💡 HƯỚNG DẪN KHẮC PHỤC:');
  console.log('─'.repeat(50));
  console.log('1. Kiểm tra máy in:');
  console.log('   - Bật máy in và đợi khởi động hoàn tất');
  console.log('   - Kiểm tra đèn báo trên máy in');
  console.log('   - In test page từ máy in (nếu có)');
  console.log('\n2. Kiểm tra IP address:');
  console.log('   - Vào menu máy in → Network Settings');
  console.log('   - Xác nhận IP address là 192.168.2.234');
  console.log('   - Nếu khác, cập nhật lại trong database');
  console.log('\n3. Kiểm tra mạng:');
  console.log('   - Đảm bảo máy in và PC cùng mạng');
  console.log('   - Thử ping từ PC: ping 192.168.2.234');
  console.log('   - Kiểm tra router có chặn giao tiếp không');
  console.log('\n4. Kiểm tra port:');
  console.log('   - Đảm bảo port 9100 được bật trong cài đặt máy in');
  console.log('   - Kiểm tra firewall không chặn port 9100');
  console.log('\n═══════════════════════════════════════════════════════════');
}

// Chạy kiểm tra
main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

