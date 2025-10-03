// Vercel API endpoint cho in hóa đơn
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order, items, printer_name, template_content } = req.body;
    
    console.log('🧾 Invoice print request:', {
      printer: printer_name,
      order_id: order?.id,
      items_count: items?.length
    });

    // Demo mode - chỉ log thông tin
    const printContent = template_content || getDefaultInvoiceTemplate(order, items);
    
    console.log('📄 Invoice print content:');
    console.log(printContent);

    // Trong môi trường thực tế, sẽ gửi đến Windows server
    // const windowsServerUrl = 'http://localhost:9977';
    // await fetch(`${windowsServerUrl}/print/invoice`, { ... });

    res.status(200).json({ 
      success: true, 
      message: `Invoice print job sent to ${printer_name} (demo mode)`,
      content: printContent
    });

  } catch (error) {
    console.error('❌ Invoice print error:', error);
    res.status(500).json({ 
      error: 'Invoice print failed',
      details: error.message 
    });
  }
}

function getDefaultInvoiceTemplate(order, items) {
  let content = `\n`;
  content += `        HÓA ĐƠN THANH TOÁN\n`;
  content += `================================\n`;
  content += `Đơn: ${order.order_number || order.id}\n`;
  content += `Bàn: ${order.table_name || order.table_id}\n`;
  content += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
  content += `--------------------------------\n`;
  
  let total = 0;
  items.forEach(item => {
    const itemTotal = parseFloat(item.total_price) || (item.price * item.quantity);
    content += `${item.name} x${item.quantity}\n`;
    if (item.special_instructions) {
      content += `  Ghi chú: ${item.special_instructions}\n`;
    }
    content += `${itemTotal.toLocaleString('vi-VN')}đ\n\n`;
    total += itemTotal;
  });
  
  content += `--------------------------------\n`;
  content += `TỔNG CỘNG: ${total.toLocaleString('vi-VN')}đ\n`;
  content += `================================\n`;
  content += `    Cảm ơn quý khách!\n`;
  content += `\n\n\n`;
  
  return content;
}
