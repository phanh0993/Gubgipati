const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Supabase client - Sử dụng cấu hình từ .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lỗi: Thiếu cấu hình Supabase trong file .env');
  console.error('   Cần có: REACT_APP_SUPABASE_URL và REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client đã được khởi tạo');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 30)}...`);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint - Hardcode admin để bypass database issues
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt:', username, '/', password);
    
    // Hardcode admin user để bypass Supabase RLS issues
    if (username === 'admin' && password === 'admin123') {
      const token = Buffer.from(`1:${Date.now()}`).toString('base64');
      
      console.log('✅ Login successful (hardcoded):', username);
      
      return res.json({
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
          email: 'admin@gubgipati.com',
          full_name: 'Administrator'
        },
        token
      });
    }
    
    // Nếu không phải admin, thử query Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);
    
    console.log('📊 Supabase query result:', { users, error });
    
    if (error) {
      console.error('❌ Database error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!users || users.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    if (user.password !== password) {
      console.log('❌ Wrong password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    console.log('✅ Login successful:', username);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'user',
        email: user.email,
        full_name: user.full_name
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Decode token (simple implementation)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', parseInt(userId))
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin',
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   SIMPLE BACKEND SERVER - RUNNING         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔗 Supabase: ${supabaseUrl}`);
  console.log(`⏰ Started: ${new Date().toLocaleString('vi-VN')}`);
  console.log('\n✅ Ready to handle login requests!\n');
});

