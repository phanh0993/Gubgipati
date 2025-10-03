// Vercel API endpoint cho in phiếu bếp
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order, items, printer_name, template_content } = req.body;
    
    console.log('🍳 Kitchen print request:', {
      printer: printer_name,
      order_id: order?.id,
      items_count: items?.length
    });

    // Demo mode - chỉ log thông tin
    const printContent = template_content || getDefaultKitchenTemplate(order, items);
    
    console.log('📄 Kitchen print content:');
    console.log(printContent);

    // Trong môi trường thực tế, sẽ gửi đến Windows server
    // const windowsServerUrl = 'http://localhost:9977';
    // await fetch(`${windowsServerUrl}/print/kitchen`, { ... });

    res.status(200).json({ 
      success: true, 
      message: `Kitchen print job sent to ${printer_name} (demo mode)`,
      content: printContent
    });

  } catch (error) {
    console.error('❌ Kitchen print error:', error);
    res.status(500).json({ 
      error: 'Kitchen print failed',
      details: error.message 
    });
  }
}

function getDefaultKitchenTemplate(order, items) {
  let content = `\n`;
  content += `================================\n`;
  content += `    BẾP - ĐƠN HÀNG\n`;
  content += `================================\n`;
  content += `Đơn: ${order.order_number || order.id}\n`;
  content += `Bàn: ${order.table_name || order.table_id}\n`;
  content += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
  content += `--------------------------------\n`;
  
  items.forEach(item => {
    content += `${item.name} x${item.quantity}\n`;
    if (item.special_instructions) {
      content += `  Ghi chú: ${item.special_instructions}\n`;
    }
    content += `\n`;
  });
  
  content += `================================\n`;
  content += `\n\n\n`;
  
  return content;
}
