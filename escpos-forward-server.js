const express = require('express');
const net = require('net');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json({ limit: '8mb' }));

const OUTPUT_DIR = path.join(process.cwd(), 'output');
try {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
} catch (e) {
  console.error('⚠️ Không thể tạo output/, hãy tự tạo thư mục output cùng thư mục .exe');
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
});

// Nhận raw base64 (buffer ESC/POS), gửi trực tiếp tới máy in qua TCP/IP
app.post('/print-raw', (req, res) => {
  const { printer_ip, port = 9100, raw_base64 } = req.body;
  if (!printer_ip || !raw_base64)
    return res.status(400).json({ success: false, error: 'printer_ip & raw_base64 required' });
  const buffer = Buffer.from(raw_base64, 'base64');
  fs.writeFileSync(path.join(OUTPUT_DIR, `raw_${Date.now()}.bin`), buffer); // debug
  const client = new net.Socket();
  let responded = false;
  client.connect(port, printer_ip, () => {
    client.write(buffer);
    client.end();
  });
  client.on('close', () => {
    if (!responded) { responded = true; res.json({ success: true }); }
  });
  client.on('error', e => {
    if (!responded) { responded = true; res.status(500).json({ success: false, error: e.message }); }
  });
});

app.use('/output', express.static(OUTPUT_DIR));
app.listen(9988, () => console.log('ESC/POS Forward Server (lite): http://localhost:9988'));
