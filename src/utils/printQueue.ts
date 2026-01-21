// Print Queue System - Cho phép mobile order in qua PC
import { supabase } from '../services/supabaseClient';

// Kiểm tra xem có phải đang truy cập từ mobile không
export const isMobileDevice = (): boolean => {
  // Check nếu URL không phải localhost (tức là truy cập từ network)
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
};

// Thêm lệnh in vào queue (cho mobile) - THEO SCHEMA THỰC TẾ
export const addToQueue = async (
  orderId: number,
  items: any[],
  tableName: string,
  zoneName: string,
  staffName: string,
  printType: string = 'kitchen'
): Promise<boolean> => {
  try {
    console.log(`📤 [QUEUE] Thêm lệnh in vào queue: Order ${orderId}`);
    
    const { data, error } = await supabase
      .from('mobile_print_queue')
      .insert([{
        order_id: orderId,
        items: items, // JSONB array
        table_name: tableName,
        zone_name: zoneName,
        staff_name: staffName,
        print_type: printType,
        status: 'pending'
      }])
      .select();
    
    if (error) {
      console.error('❌ Lỗi thêm vào queue:', error);
      return false;
    }
    
    console.log(`✅ Đã thêm vào queue (ID: ${data[0].id}), ${items.length} món`);
    return true;
    
  } catch (err) {
    console.error('❌ Exception khi thêm queue:', err);
    return false;
  }
};

// Gửi lệnh in phiếu order (tự động chọn queue hoặc direct)
export const sendPrintJobViaQueue = async (
  orderId: number,
  items: any[],
  tableName: string,
  zoneName: string,
  staffName: string
): Promise<{ success: boolean; message: string; viaQueue?: boolean }> => {
  
  const isMobile = isMobileDevice();
  
  // Nếu từ mobile → Dùng queue
  if (isMobile) {
    console.log('📱 Mobile device detected → Using print queue');
    
    const success = await addToQueue(
      orderId,
      items,
      tableName,
      zoneName,
      staffName,
      'kitchen'
    );
    
    if (success) {
      return {
        success: true,
        message: 'Lệnh in đã được thêm vào queue. Máy PC sẽ xử lý.',
        viaQueue: true
      };
    } else {
      return {
        success: false,
        message: 'Lỗi thêm vào queue',
        viaQueue: true
      };
    }
  }
  
  // Nếu từ PC → Trả về để xử lý direct (logic cũ)
  return {
    success: false,
    message: 'PC mode - use direct print',
    viaQueue: false
  };
};

export default {
  isMobileDevice,
  addToQueue,
  sendPrintJobViaQueue
};

