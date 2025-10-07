// Vercel serverless function for kitchen printing
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order, items, printer_name, template_content } = req.body;
    
    console.log('🍳 Kitchen print request:', {
      printer_name,
      order_id: order?.id,
      items_count: items?.length,
      has_template: !!template_content
    });

    // Demo mode - chỉ log thông tin
    const printContent = template_content || `
DON HANG - BEP
================================
So the: ${order?.id || 'N/A'}
Thoi gian: ${new Date().toLocaleString('vi-VN')}
Ban: ${order?.table_name || order?.table_id || 'N/A'}
================================
${items?.map(item => `${item.name} x${item.quantity}`).join('\n') || 'Khong co mon an'}
================================
`;

    console.log('📄 Kitchen print content:');
    console.log(printContent);

    // Trong thực tế, đây sẽ gửi đến Windows server
    // Hiện tại chỉ return success để test
    return res.status(200).json({
      success: true,
      message: `Kitchen print sent to ${printer_name} (demo mode)`,
      content: printContent
    });

  } catch (error) {
    console.error('❌ Kitchen print error:', error);
    return res.status(500).json({ 
      error: 'Kitchen print failed',
      details: error.message 
    });
  }
}