import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { formatVietnamTime } from '../utils/timeUtils';
import { formatFoodItemName } from '../utils/formatters';

// Component polling print queue mỗi 3 giây
// Chạy trên PC để xử lý lệnh in từ mobile

// Kiểm tra xem có phải đang chạy trên PC không (localhost)
const isPCDevice = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

const PrintQueuePoller: React.FC = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    // Chỉ chạy trên PC (localhost), không chạy trên mobile
    if (!isPCDevice()) {
      console.log('📱 Mobile device detected - Print Queue Poller disabled');
      return;
    }
    
    console.log('🔄 Print Queue Poller started (polling every 3s) - PC mode');
    
    // Poll ngay lập tức
    pollQueue();
    
    // Sau đó poll mỗi 3 giây
    intervalRef.current = setInterval(() => {
      pollQueue();
    }, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Print Queue Poller stopped');
      }
    };
  }, []);

  const pollQueue = async () => {
    // Tránh chạy đồng thời
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      
      // Lấy các lệnh in pending
      const { data: pendingJobs, error } = await supabase
        .from('mobile_print_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('❌ Lỗi query queue:', error);
        return;
      }
      
      if (!pendingJobs || pendingJobs.length === 0) {
        // Không có lệnh in, không log gì
        return;
      }
      
      console.log(`📥 [QUEUE] Tìm thấy ${pendingJobs.length} lệnh in`);
      
      // Xử lý từng lệnh
      for (const job of pendingJobs) {
        await processQueueJob(job);
      }
      
    } catch (err) {
      console.error('❌ Exception trong pollQueue:', err);
    } finally {
      processingRef.current = false;
    }
  };

  const processQueueJob = async (job: any) => {
    try {
      console.log(`🖨️ [QUEUE] Processing job ${job.id}: Order ${job.order_id}, ${job.items?.length || 0} món`);
      
      // ✅ TRÁNH DOUBLE PRINT: Update status = processing và kiểm tra xem đã được xử lý chưa
      const { data: checkJob, error: checkError } = await supabase
        .from('mobile_print_queue')
        .select('status')
        .eq('id', job.id)
        .single();
      
      // Nếu job đã được xử lý (processing hoặc completed) hoặc không tồn tại, bỏ qua
      if (checkError || !checkJob || (checkJob.status !== 'pending')) {
        console.log(`⚠️ [QUEUE] Job ${job.id} đã được xử lý hoặc không tồn tại (status: ${checkJob?.status || 'unknown'}), bỏ qua`);
        return;
      }
      
      // Update status = processing (atomic update để tránh race condition)
      const { data: updateData, error: updateError } = await supabase
        .from('mobile_print_queue')
        .update({ 
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .eq('status', 'pending') // Chỉ update nếu vẫn còn pending
        .select();
      
      // Nếu không update được (có thể đã bị xử lý bởi instance khác), bỏ qua
      if (updateError || !updateData || updateData.length === 0) {
        console.log(`⚠️ [QUEUE] Job ${job.id} đã được xử lý bởi instance khác, bỏ qua`);
        return;
      }
      
      // Lấy map_printer để biết in tới máy nào
      const { data: mappings } = await supabase
        .from('map_printer')
        .select('printer_id, food_item_id, printers(*)');
      
      if (!mappings || mappings.length === 0) {
        console.warn(`⚠️ Không có printer mapping, bỏ qua job ${job.id}`);
        // Xóa job
        await supabase.from('mobile_print_queue').delete().eq('id', job.id);
        return;
      }
      
      // In từng món
      const items = job.items || [];
      let printSuccess = 0;
      let printFailed = 0;
      
      for (const item of items) {
        // Lấy food_item_id từ item (có thể là item.food_item_id hoặc item.id)
        const foodItemId = item.food_item_id || item.id || item.food_item?.id;
        
        if (!foodItemId) {
          console.warn(`⚠️ Món "${item.name || 'Unknown'}" không có food_item_id, skip`);
          console.warn('   Item data:', item);
          continue;
        }
        
        // Tìm printer cho món này
        const itemMappings = mappings.filter((m: any) => 
          m.food_item_id === foodItemId
        );
        
        if (itemMappings.length === 0) {
          console.log(`⚠️ Món "${item.name || 'Unknown'}" (ID: ${foodItemId}) không có mapping, skip`);
          continue;
        }
        
        console.log(`✅ Tìm thấy ${itemMappings.length} mapping cho món "${item.name}" (ID: ${foodItemId})`);
        
        for (const mapping of itemMappings) {
          const printer = Array.isArray(mapping.printers) ? mapping.printers[0] : mapping.printers;
          if (!printer) continue;
          
          try {
            // Tạo template cho món này - THÊM NOTE
            const timeStr = formatVietnamTime(new Date());
            const tableInfo = `${timeStr} | ${job.table_name || 'N/A'} - ${job.zone_name || 'N/A'}\n${job.staff_name || 'N/A'}`;
            
            // Format tên món (đổi "COMBO NƯỚC + TRÁNG MIỆNG" thành "NƯỚC+TM")
            const formattedItemName = formatFoodItemName(item.name);
            let itemLine = `${formattedItemName} - x${item.quantity || 1}`;
            if (item.special_instructions) {
              // Thêm dòng trống trước note
              itemLine += `\n\n  Ghi chú: ${item.special_instructions}`;
            }
            
            const template = `ĐƠN HÀNG - ${printer.location || 'BẾP'}
================================
${tableInfo}
================================
${itemLine}
================================`;
            
            // Tạo ảnh từ template (dùng function local)
            const imageBase64 = createImageFromTemplate(template, job, [item], printer);
            
            if (!imageBase64) {
              console.error(`❌ Không tạo được ảnh cho ${item.name}`);
              printFailed++;
              continue;
            }
            
            // Gửi tới printer server (port 9000)
            const printerServerUrl = 'http://localhost:9000';
            console.log(`🖨️ [QUEUE] Gửi in đến ${printer.name} (${printer.location}) qua ${printerServerUrl}`);
            console.log(`   Printer details:`, {
              name: printer.name,
              location: printer.location,
              connection_type: printer.connection_type,
              ip_address: printer.ip_address,
              port_number: printer.port_number,
              usb_port: printer.usb_port
            });
            
            try {
              const response = await fetch(`${printerServerUrl}/print/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  printer_name: printer.name,
                  image_base64: imageBase64,
                  filename: `queue_${job.id}_${item.name}_${Date.now()}.png`,
                  meta: {
                    queue_id: job.id,
                    order_id: job.order_id,
                    item: item.name
                  }
                })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log(`✅ In thành công: ${item.name} → ${printer.name} (${printer.location})`, result.message || '');
                printSuccess++;
              } else {
                const errorText = await response.text();
                console.error(`❌ Lỗi in ${item.name} → ${printer.name}:`, response.status, errorText);
                printFailed++;
              }
            } catch (fetchErr: any) {
              const errorMessage = fetchErr.message || String(fetchErr);
              console.error(`❌ Lỗi kết nối printer server cho ${item.name} → ${printer.name}:`, errorMessage);
              
              if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CONNECTION_REFUSED') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
                console.error(`⚠️ Printer server không chạy! Cần khởi động START-PRINTER-SERVER.bat hoặc START-FINAL.bat`);
              }
              printFailed++;
            }
            
          } catch (printErr) {
            console.error(`❌ Exception khi in ${item.name}:`, printErr);
            printFailed++;
          }
        }
      }
      
      // ✅ Xóa job khỏi queue sau khi xử lý xong (chỉ xóa nếu status = processing để tránh xóa nhầm)
      const { error: deleteError } = await supabase
        .from('mobile_print_queue')
        .delete()
        .eq('id', job.id)
        .eq('status', 'processing'); // Chỉ xóa nếu vẫn đang processing (tránh xóa nhầm job đã bị xử lý)
      
      if (deleteError) {
        console.error(`❌ Lỗi xóa job ${job.id} khỏi queue:`, deleteError);
      } else {
        console.log(`✅ Job ${job.id} hoàn tất: ${printSuccess} thành công, ${printFailed} lỗi. Đã xóa khỏi queue.`);
      }
      
    } catch (err) {
      console.error(`❌ Lỗi xử lý job ${job.id}:`, err);
      
      // Update status = failed
      await supabase
        .from('mobile_print_queue')
        .update({ 
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
  };

  // Component không render gì
  return null;
};

export default PrintQueuePoller;

// Helper function tạo ảnh từ template (copy từ api.ts)
const createImageFromTemplate = (template: string, orderData: any, items: any[], printer: any): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Import font helper
  const { getTimesNewRomanFont, loadTimesNewRomanFonts } = require('../utils/fontLoader');
  if (typeof window !== 'undefined') {
    loadTimesNewRomanFonts();
  }
  
  const width = 560;
  const baseFont = 30;
  const lineHeight = 38;
  
  const lines = template.split('\n');
  const estimatedHeight = Math.max(460, lines.length * lineHeight + 80);
  
  canvas.width = width;
  canvas.height = estimatedHeight;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, estimatedHeight);
  ctx.fillStyle = '#000000';
  ctx.font = getTimesNewRomanFont(baseFont, true, false);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  let y = 0;
  
  lines.forEach(line => {
    if (line.trim()) {
      if (line.toUpperCase().includes('ĐƠN HÀNG') || line.toUpperCase().includes('DON HANG')) {
        ctx.font = getTimesNewRomanFont(baseFont + 4, true, false);
        const textWidth = ctx.measureText(line).width;
        const x = (width - textWidth) / 2;
        ctx.fillText(line, x, y);
        ctx.font = getTimesNewRomanFont(baseFont, true, false);
      } else if (line.includes('|')) {
        // Dòng info (Thời gian | Bàn | NV) - Tách tên nhân viên ra dòng riêng
        const parts = line.split('|').map(p => p.trim());
        // Nếu có 3 phần (Thời gian | Bàn | NV), tách NV ra dòng riêng
        if (parts.length >= 3) {
          // Dòng 1: Thời gian | Bàn
          const infoLine = parts.slice(0, 2).join(' | ');
          ctx.font = getTimesNewRomanFont(Math.round(baseFont * 0.8 * 1.3), true, false); // 24px * 1.3 = 31px
          ctx.fillText(infoLine, 5, y);
          y += lineHeight;
          
          // Dòng 2: Tên nhân viên (chữ bé lại 15%)
          const staffName = parts.slice(2).join(' | '); // Lấy phần còn lại (có thể có nhiều phần)
          const staffFontSize = Math.round(baseFont * 0.8 * 1.3 * 0.85); // 31px * 0.85 = 26.35px ≈ 26px
          ctx.font = getTimesNewRomanFont(staffFontSize, true, false);
          ctx.fillText(staffName, 5, y);
          ctx.font = getTimesNewRomanFont(baseFont, true, false);
        } else {
          // Nếu không có đủ 3 phần, in bình thường
          ctx.font = getTimesNewRomanFont(Math.round(baseFont * 0.8 * 1.3), true, false); // 24px * 1.3 = 31px
          ctx.fillText(line, 5, y);
          ctx.font = getTimesNewRomanFont(baseFont, true, false);
        }
      }
      // Dòng chỉ có tên nhân viên ({{staff_name}} đã được render riêng) - Giảm 15%
      else if (line.includes('NV:') || line.includes('Nhan vien:') || line.includes('Nhân viên:')) {
        const staffFontSize = Math.round(baseFont * 0.8 * 1.3 * 0.85); // 31px * 0.85 = 26.35px ≈ 26px
        ctx.font = getTimesNewRomanFont(staffFontSize, true, false);
        ctx.fillText(line, 5, y);
        ctx.font = getTimesNewRomanFont(baseFont, true, false);
      } else if (line.includes(' - x')) {
        // Item với số lượng (in đậm) - Giảm 30% size: từ 51px → 36px
        const itemFontSize = Math.round((baseFont + 2) * 1.6 * 0.7); // 51px * 0.7 = 36px
        ctx.font = getTimesNewRomanFont(itemFontSize, true, false);
        ctx.fillText(line, 5, y);
        ctx.font = getTimesNewRomanFont(baseFont, true, false);
      } else if (line.trim().startsWith('Ghi chú:') || line.trim().startsWith('Ghi chu:')) {
        // Dòng ghi chú - tăng 30% size, in nghiêng
        // Tăng 30% từ 21px: 21 * 1.3 = 27.3px, làm tròn 27px
        const noteFontSize = Math.round(baseFont * 0.7 * 1.3); // 21px * 1.3 = 27px
        ctx.font = getTimesNewRomanFont(noteFontSize, false, true); // 27px, italic
        ctx.fillText(line, 5, y);
        ctx.font = getTimesNewRomanFont(baseFont, true, false);
      } else {
        ctx.fillText(line, 5, y);
      }
    }
    y += lineHeight;
  });
  
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = 460;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, width, 460);
    finalCtx.drawImage(canvas, 0, 0);
  }
  
  return finalCanvas.toDataURL('image/png');
};

