// API endpoint cho printers trên Vercel
// File: api/printers.js
// Mô tả: Xử lý quét máy in và test print

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Quét máy in từ database
      console.log('🔍 Fetching printers from database...');
      
      const { data: printers, error } = await supabase
        .from('printers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching printers:', error);
        return res.status(500).json({ error: 'Failed to fetch printers' });
      }

      // Format printers theo DiscoveredPrinter interface
      const formattedPrinters = (printers || []).map((printer, index) => ({
        id: `printer_${printer.id || index}`,
        name: printer.name,
        driver: printer.driver || 'Unknown',
        port: printer.port || printer.ip_address || 'Unknown',
        status: printer.is_active ? 'ready' : 'error'
      }));

      console.log(`✅ Found ${formattedPrinters.length} printers from database`);
      return res.status(200).json(formattedPrinters);

    } else if (req.method === 'POST') {
      const { printerName, content, title } = req.body;

      if (printerName && content) {
        // Test print - chỉ log trên Vercel (không thể in thực tế)
        console.log('🖨️ Test Print Request:');
        console.log(`Printer: ${printerName}`);
        console.log(`Title: ${title || 'Test Print'}`);
        console.log(`Content: ${content}`);
        console.log('--- End Test Print ---');

        return res.status(200).json({ 
          message: `Test print logged for ${printerName}`, 
          success: true,
          note: 'Vercel cannot print to physical printers. Use local restaurant-api-server for actual printing.'
        });
      } else {
        return res.status(400).json({ error: 'Missing printerName or content' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Printers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
