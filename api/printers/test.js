// API route cho test print máy in
// File: api/printers/test.js
// Mô tả: Endpoint để test in máy in

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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
    const { printer_id, content } = req.body;

    if (!printer_id || !content) {
      return res.status(400).json({ error: 'Missing printer_id or content' });
    }

    // Lấy thông tin máy in từ Supabase
    const { data: printer, error: printerError } = await supabase
      .from('printers')
      .select('*')
      .eq('id', printer_id)
      .single();

    if (printerError || !printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    // Trên Vercel không thể in thực tế
    // Chỉ mô phỏng thành công
    console.log(`Mock print to ${printer.name}:`, content);

    res.status(200).json({
      message: `Mock printed to ${printer.name} (Vercel demo mode)`,
      success: true,
      printer: printer.name,
      note: 'Vercel không thể in thực tế - chỉ demo'
    });

  } catch (error) {
    console.error('Test print error:', error);
    res.status(500).json({ 
      error: 'Test print failed', 
      details: error.message 
    });
  }
}
