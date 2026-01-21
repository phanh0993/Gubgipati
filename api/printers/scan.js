// API route cho scan máy in
// File: api/printers/scan.js
// Mô tả: Endpoint để quét máy in từ Windows

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Trên Vercel không thể truy cập Windows PowerShell
    // Trả về danh sách máy in mẫu để demo
    const mockPrinters = [
      {
        id: 'printer_1',
        name: 'Microsoft Print to PDF',
        driver: 'Microsoft Print to PDF',
        port: 'PORTPROMPT:',
        status: 'ready'
      },
      {
        id: 'printer_2', 
        name: 'HP LaserJet Pro M404n',
        driver: 'HP LaserJet Pro M404n PCL 6',
        port: 'USB001',
        status: 'ready'
      },
      {
        id: 'printer_3',
        name: 'Canon PIXMA G3010',
        driver: 'Canon PIXMA G3010 series',
        port: 'IP_192.168.1.100',
        status: 'ready'
      }
    ];

    res.status(200).json({ 
      printers: mockPrinters,
      message: 'Demo printers - Vercel không thể quét máy in Windows thực tế'
    });

  } catch (error) {
    console.error('Scan printers error:', error);
    res.status(500).json({ 
      error: 'Failed to scan printers', 
      details: error.message 
    });
  }
}
