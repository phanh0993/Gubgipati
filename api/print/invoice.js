// Vercel serverless function for invoice printing
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order, items, printer_name, template_content } = req.body;
    
    console.log('🧾 Invoice print request:', {
      printer_name,
      order_id: order?.id,
      items_count: items?.length,
      has_template: !!template_content
    });

    // Demo mode - chỉ log thông tin
    const printContent = template_content || `
HOA DON TAM TINH
================================
Tai ban: ${order?.table_name || order?.table_id || 'N/A'}
Gio vao: ${order?.checkin_time || new Date().toLocaleString('vi-VN')}
Gio in: ${new Date().toLocaleString('vi-VN')}
Khach hang: ${order?.customer_name || 'N/A'}

================================
${items?.map(item => `${item.name} x${item.quantity} - ${item.price ? item.price.toLocaleString('vi-VN') + 'd' : '0d'}`).join('\n') || 'Khong co mon an'}
================================
TONG TAM TINH: ${items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0).toLocaleString('vi-VN')}d
================================
Cam on quy khach!
`;

    console.log('📄 Invoice print content:');
    console.log(printContent);

    // Trong thực tế, đây sẽ gửi đến Windows server
    // Hiện tại chỉ return success để test
    return res.status(200).json({
      success: true,
      message: `Invoice print sent to ${printer_name} (demo mode)`,
      content: printContent
    });

  } catch (error) {
    console.error('❌ Invoice print error:', error);
    return res.status(500).json({ 
      error: 'Invoice print failed',
      details: error.message 
    });
  }
}