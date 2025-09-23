import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL as string || '').trim();
const SUPABASE_ANON_KEY = (process.env.REACT_APP_SUPABASE_ANON_KEY as string || '').trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Hiển thị cảnh báo rõ ràng để dễ debug trên production
  console.error('Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

if (process.env.NODE_ENV !== 'production') {
  const mask = (key: string) => (key ? `${key.slice(0, 6)}...${key.slice(-6)}` : 'undefined');
  // Log rút gọn để xác nhận ENV đã nạp đúng khi dev
  console.log('Supabase ENV:', {
    url: SUPABASE_URL || 'undefined',
    anonKey: mask(SUPABASE_ANON_KEY)
  });
}


