// Helper function tạo ảnh bill PNG từ data order
// Dùng chung cho tất cả trang: BuffetTableSelection, MobileBill, SimpleBuffetPOS, v.v.

import { getTimesNewRomanFont, loadTimesNewRomanFonts } from './fontLoader';
import { formatVietnamDateTime } from './timeUtils';
import { formatFoodItemName } from './formatters';

// Load fonts khi module được import
if (typeof window !== 'undefined') {
  loadTimesNewRomanFonts();
}

interface BillItem {
  name: string;
  quantity: number;
  price: number;
  note?: string;
  special_instructions?: string;
}

interface BillData {
  orderNumber?: string;
  tableName?: string;
  area?: string;
  staffName?: string;
  customerName?: string;
  items: BillItem[];
  buffetPackageName?: string;
  buffetQuantity?: number;
  buffetPrice?: number;
  totalAmount: number;
  createdAt?: string;
  notes?: string;
  discountAmount?: number;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
}

// Hàm tạo ảnh bill PNG từ data
export const generateBillImage = (billData: BillData, isPayment: boolean = false, isCheckBill: boolean = false): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Cannot create canvas context');
  
  // Kích thước chuẩn cho máy in 76mm (giảm từ 80mm để fit)
  const width = 560; // 76mm @ 203 DPI
  const leftMargin = 16;
  const rightMargin = 10;
  const contentWidth = width - leftMargin - rightMargin;
  
  // Tính chiều cao động: Header + Vé + Items + Footer
  // Tăng chiều dài tối thiểu thêm 30px
  const baseHeight = 580; // 550 + 30px
  const buffetHeight = (billData.buffetPackageName && billData.buffetQuantity) ? 60 : 0;
  
  // Tính chiều cao items: mỗi item cơ bản + note (nếu có)
  let itemsHeight = 0;
  billData.items.forEach(item => {
    itemsHeight += 70; // Base height cho item
    if (item.note || item.special_instructions) {
      itemsHeight += 35; // Thêm cho note
    }
    itemsHeight += 25; // Space giữa items (tăng từ 15px)
  });
  
  let estimatedHeight = baseHeight + buffetHeight + itemsHeight + 100; // +100 buffer
  
  canvas.width = width;
  canvas.height = estimatedHeight;
  
  // Background trắng
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, estimatedHeight);
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';
  
  let y = 20;
  const lineHeight = 44;
  
  // Helper vẽ text với font Times New Roman
  const drawText = (text: string, fontSize: number = 36, bold: boolean = false, align: 'left' | 'center' | 'right' = 'left', italic: boolean = false) => {
    ctx.font = getTimesNewRomanFont(fontSize, bold, italic);
    ctx.textAlign = align;
    
    let x = leftMargin;
    if (align === 'center') x = width / 2;
    if (align === 'right') x = width - rightMargin;
    
    ctx.fillText(text, x, y);
    y += lineHeight;
  };
  
  // ===== HEADER theo ảnh mẫu =====
  drawText('GUBGIPATI', 42, true, 'center');
  y += 10;
  // Địa chỉ giảm 15% (từ 24px → 20px, làm tròn)
  ctx.font = getTimesNewRomanFont(20, true, false);
  ctx.textAlign = 'center';
  ctx.fillText('109 Huỳnh Cương', width / 2, y);
  y += 32;
  ctx.font = getTimesNewRomanFont(26, true, false);
  ctx.fillText('SĐT: 0969709033', width / 2, y);
  y += 38;
  
  // Loại hóa đơn
  let billTitle: string;
  if (isCheckBill) {
    billTitle = 'PHIẾU KIỂM ĐỒ';
  } else if (isPayment) {
    billTitle = 'HÓA ĐƠN THANH TOÁN';
  } else {
    billTitle = 'HÓA ĐƠN TẠM TÍNH';
  }
  drawText(billTitle, 40, true, 'center');
  y += 10;
  drawText('================================', 36, false, 'left');
  
  // Thông tin đơn - Sử dụng múi giờ Việt Nam (+7)
  const now = new Date();
  // Format thời gian theo múi giờ Việt Nam
  const timeStr = formatVietnamDateTime(now, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  if (billData.tableName) {
    drawText(`Tại bàn: ${billData.tableName}`, 32, false);
  }
  drawText(`Giờ in: ${timeStr}`, 30, false);
  if (billData.staffName && billData.staffName !== 'N/A') {
    drawText(`NV: ${billData.staffName}`, 30, false);
  }
  if (billData.customerName && billData.customerName !== 'Khách lẻ') {
    drawText(`Khách: ${billData.customerName}`, 30, false);
  }
  y += 5;
  drawText('================================', 36, false, 'left');
  
  // ===== BẢNG 3 CỘT: Mặt hàng | SL | TT =====
  // Layout: Tên món (40%) | SL (20%) | TT (40%)
  // contentWidth đã được khai báo ở trên (dòng 45)
  const slColumnWidth = contentWidth * 0.20; // 20% = 107px
  const ttColumnWidth = contentWidth * 0.40; // 40% = 214px
  const nameColumnWidth = contentWidth - slColumnWidth - ttColumnWidth; // 40% = 213px
  
  const slColumnX = leftMargin + nameColumnWidth + (slColumnWidth / 2); // Center của cột SL
  const ttColumnX = width - rightMargin; // Right của cột TT
  
  // Vẽ header bảng
  ctx.font = getTimesNewRomanFont(22, true, false);
  ctx.textAlign = 'left';
  ctx.fillText('Mặt hàng', leftMargin, y);
  ctx.textAlign = 'center';
  ctx.fillText('SL', slColumnX, y);
  ctx.textAlign = 'right';
  ctx.fillText('TT', ttColumnX, y);
  y += 30;
  
  // Vẽ đường kẻ ngang (border top table)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftMargin, y);
  ctx.lineTo(width - rightMargin, y);
  ctx.stroke();
  y += 5;
  
  // Lọc items nếu là thanh toán (chỉ món giá > 0)
  let itemsToPrint = billData.items;
  if (isPayment) {
    itemsToPrint = billData.items.filter(item => item.price > 0);
  }
  
  // Vé buffet (nếu có) - 1 DÒNG với format: "Vé 169K x1    169,000d"
  if (billData.buffetPackageName && billData.buffetQuantity) {
    const buffetTotal = (billData.buffetPrice || 0) * billData.buffetQuantity;
    
    ctx.font = getTimesNewRomanFont(24, true, false);
    ctx.textAlign = 'left';
    // Format tên gói buffet (đổi "COMBO NƯỚC + TRÁNG MIỆNG" thành "NƯỚC+TM")
    const formattedPackageName = formatFoodItemName(billData.buffetPackageName);
    ctx.fillText(`${formattedPackageName} x${billData.buffetQuantity}`, leftMargin + 5, y);
    
    // Thành tiền (cột phải)
    ctx.textAlign = 'right';
    ctx.fillText(`${buffetTotal.toLocaleString('vi-VN')}d`, ttColumnX, y);
    y += 38;
    
    // Border bottom cho vé
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width - rightMargin, y);
    ctx.stroke();
    y += 5;
  }
  
  // Danh sách món
  itemsToPrint.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    const rowStartY = y;
    
    // Tên món (cột 1) - Tăng font size thêm 20% (từ 24px lên 29px)
    ctx.font = getTimesNewRomanFont(29, true, false);
    ctx.textAlign = 'left';
    // Format tên món (đổi "COMBO NƯỚC + TRÁNG MIỆNG" thành "NƯỚC+TM") và cắt nếu quá dài (tối đa 20 ký tự)
    const formattedName = formatFoodItemName(item.name);
    const itemName = formattedName.length > 20 ? formattedName.substring(0, 20) : formattedName;
    ctx.fillText(itemName, leftMargin + 5, y);
    
    // SL (cột 2) - Center trong cột 20% - Tăng font size thêm 20% (từ 24px lên 29px)
    ctx.font = getTimesNewRomanFont(29, true, false);
    ctx.textAlign = 'center';
    ctx.fillText(`${item.quantity}`, slColumnX, y);
    
    // Thành tiền (cột 3) - Right trong cột 40% - Tăng font size thêm 20% (từ 24px lên 29px)
    ctx.font = getTimesNewRomanFont(29, true, false);
    ctx.textAlign = 'right';
    ctx.fillText(`${itemTotal.toLocaleString('vi-VN')}d`, ttColumnX, y);
    y += 32;
    
    // Note (nếu có)
    if (item.note || item.special_instructions) {
      ctx.font = getTimesNewRomanFont(20, false, true);
      ctx.textAlign = 'left';
      const noteText = (item.note || item.special_instructions || '').substring(0, 25);
      ctx.fillText(`  ${noteText}`, leftMargin + 5, y);
      y += 26;
    }
    
    y += 15; // Space between rows (tăng từ 10)
    
    // Vẽ border bottom cho row (đường kẻ ngang mỏng)
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width - rightMargin, y);
    ctx.stroke();
    y += 2;
  });
  
  // Border bottom bảng (đậm hơn)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftMargin, y);
  ctx.lineTo(width - rightMargin, y);
  ctx.stroke();
  y += 10;
  
  // ===== TỔNG TẠM TÍNH (trước giảm giá) =====
  const subtotal = billData.discountAmount ? (billData.totalAmount + billData.discountAmount) : billData.totalAmount;
  
  if (billData.discountAmount && billData.discountAmount > 0) {
    ctx.font = getTimesNewRomanFont(30, false, false);
    ctx.textAlign = 'left';
    ctx.fillText('Tổng tạm tính:', leftMargin, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${subtotal.toLocaleString('vi-VN')}d`, ttColumnX, y);
    y += 35;
    
    // Hiển thị giảm giá
    ctx.font = getTimesNewRomanFont(28, false, false);
    ctx.textAlign = 'left';
    const discountLabel = billData.discountType === 'percent' 
      ? `Giảm giá (${billData.discountValue}%):`
      : `Giảm giá:`;
    ctx.fillText(discountLabel, leftMargin, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-${billData.discountAmount.toLocaleString('vi-VN')}d`, ttColumnX, y);
    y += 35;
    
    // Đường kẻ
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width - rightMargin, y);
    ctx.stroke();
    y += 10;
  }
  
  // ===== TỔNG THANH TOÁN =====
  ctx.font = getTimesNewRomanFont(35, true, false);
  ctx.textAlign = 'left';
  const totalLabel = isPayment ? 'TỔNG THANH TOÁN' : 'TỔNG TẠM TÍNH';
  ctx.fillText(totalLabel, leftMargin, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${billData.totalAmount.toLocaleString('vi-VN')}d`, ttColumnX, y);
  y += 50;
  
  drawText('================================', 36, false, 'left');
  y += 10;
  
  // ===== FOOTER theo ảnh mẫu =====
  drawText('Cảm ơn quý khách!', 34, false, 'center');
  y += 5;
  drawText('Một sản phẩm của Sapo', 28, false, 'center');
  y += 15;
  drawText('Wifi: Gubgipati', 30, false, 'center');
  drawText('Pass: chucngonmieng', 30, false, 'center');
  
  // Thêm footer space để tránh cut (70px cho check bill, 20px cho các loại khác)
  const footerSpace = isCheckBill ? 70 : 20; // 50px thêm + 20px cơ bản = 70px
  y += footerSpace;
  
  // Log chiều cao để debug
  console.log(`📐 Bill dimensions: ${width}x${y}px (${(width/8).toFixed(1)}mm x ${(y/8).toFixed(1)}mm)`);
  console.log(`📊 Items count: ${billData.items.length}, Estimated height: ${estimatedHeight}px, Actual: ${y}px`);
  
  // Resize canvas về đúng chiều cao thực tế
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = y;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, width, y);
    finalCtx.drawImage(canvas, 0, 0);
  }
  
  console.log(`📄 Final bill image: ${width}x${y}px, base64 length: ${finalCanvas.toDataURL('image/png').length} chars`);
  
  return finalCanvas.toDataURL('image/png');
};

// Hàm gửi ảnh bill tới printer server (hoặc queue nếu mobile)
export const sendBillToPrinter = async (
  imageBase64: string,
  printerName: string = 'POS-80C',
  metadata?: any
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check mobile device
    const { isMobileDevice } = await import('./printQueue');
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      // Mobile → KHÔNG in trực tiếp, chỉ thông báo
      console.log('📱 Mobile device - Bill không in tự động (chỉ xem/tải)');
      return { 
        success: true, 
        message: 'Bill chỉ hiển thị trên mobile. In tự động chỉ dùng cho PC.' 
      };
    }
    
    // PC → Tự động tìm máy in Quầy Bar cho bill/hóa đơn
    let targetPrinterName = printerName;
    
    // Nếu printerName là 'POS-80C' (default) hoặc không chỉ định, tìm máy in Quầy Bar
    if (printerName === 'POS-80C' || !printerName) {
      try {
        const { supabase } = await import('../services/supabaseClient');
        const { data: printers, error: printerError } = await supabase
          .from('printers')
          .select('name, location')
          .eq('status', 'active')
          .or('location.ilike.%Quầy Bar%,location.ilike.%Quay Bar%,name.ilike.%QUAY BARR%,name.ilike.%Quay Bar%');
        
        if (!printerError && printers && printers.length > 0) {
          targetPrinterName = printers[0].name;
          console.log(`✅ Tìm thấy máy in Quầy Bar: ${targetPrinterName}`);
        } else {
          console.warn(`⚠️ Không tìm thấy máy in Quầy Bar, dùng printer mặc định: ${printerName}`);
        }
      } catch (err) {
        console.warn(`⚠️ Lỗi tìm máy in Quầy Bar, dùng printer mặc định: ${printerName}`, err);
      }
    }
    
    // PC → In trực tiếp
    const payload = {
      printer_name: targetPrinterName,
      image_base64: imageBase64,
      filename: `bill_${Date.now()}.png`,
      meta: metadata
    };
    
    console.log('📤 Gửi lệnh in tới server printer (port 9000)...');
    
    const response = await fetch('http://localhost:9000/print/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'In bill không thành công';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || `Server trả về lỗi: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ In bill thành công:', result);
    return { success: true, message: result.message || 'Đã in thành công' };
    
  } catch (error: any) {
    console.error('❌ Lỗi in bill:', error);
    
    // Xử lý lỗi kết nối cụ thể
    let errorMessage = 'Lỗi kết nối server in.';
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
      errorMessage = '❌ Không thể kết nối đến Printer Server (port 9000).\n\n' +
                     'Vui lòng kiểm tra:\n' +
                     '1. Printer Server đã được khởi động chưa?\n' +
                     '2. Chạy file START-FINAL.bat hoặc START-PRINTER-SERVER.bat\n' +
                     '3. Kiểm tra cửa sổ Printer Server có hiển thị "✅ Sẵn sàng nhận lệnh in!" không?';
    } else if (error?.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Lỗi kết nối server in. Kiểm tra server đã chạy chưa.';
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
};

// Hàm download ảnh bill
export const downloadBillImage = (imageBase64: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = imageBase64;
  link.download = filename || `bill_${Date.now()}.png`;
  link.click();
};

// Hàm in bill hoàn chỉnh: Tạo ảnh → Gửi printer → Trả kết quả
export const printBill = async (
  billData: BillData,
  printerName: string = 'POS-80C', // Default, sẽ tự động tìm Quầy Bar
  isPayment: boolean = false,
  autoDownload: boolean = false,
  isCheckBill: boolean = false
): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Tạo ảnh bill
    const billType = isCheckBill ? 'KIỂM ĐỒ' : (isPayment ? 'THANH TOÁN' : 'TẠM TÍNH');
    console.log(`📄 Tạo ảnh bill từ data (${billType})...`);
    const imageBase64 = generateBillImage(billData, isPayment, isCheckBill);
    
    // 2. Download nếu cần
    if (autoDownload) {
      downloadBillImage(imageBase64);
    }
    
    // 3. Gửi tới printer server
    const result = await sendBillToPrinter(imageBase64, printerName, billData);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Lỗi tạo/in bill:', error);
    return {
      success: false,
      message: error?.message || 'Lỗi tạo bill'
    };
  }
};

export default {
  generateBillImage,
  sendBillToPrinter,
  downloadBillImage,
  printBill
};

