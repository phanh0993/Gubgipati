/**
 * Cấu hình Supabase tập trung cho toàn bộ ứng dụng
 * File này đảm bảo tất cả các module sử dụng cùng một cấu hình Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lấy cấu hình từ environment variables
const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

// Kiểm tra cấu hình
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = '❌ Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env file';
  console.error(errorMsg);
  
  // Trong production, có thể muốn throw error
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

// Tạo Supabase client với cấu hình chuẩn
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Không lưu session trong localStorage
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'sapo-pos-app'
    }
  }
});

// Export cấu hình để sử dụng ở nơi khác nếu cần
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
};

// Log cấu hình trong development mode
if (process.env.NODE_ENV !== 'production') {
  const mask = (key: string) => (key ? `${key.slice(0, 6)}...${key.slice(-6)}` : 'undefined');
  console.log('📡 Supabase Configuration:', {
    url: SUPABASE_URL || '❌ Missing',
    anonKey: mask(SUPABASE_ANON_KEY),
    isConfigured: supabaseConfig.isConfigured
  });
}

// Export default
export default supabase;







