# HƯỚNG DẪN CẤU HÌNH SUPABASE

## 📋 Tổng quan

Hệ thống SAPO sử dụng Supabase làm database backend. Tất cả các module trong ứng dụng đều sử dụng cấu hình Supabase tập trung để đảm bảo tính nhất quán.

## 🔧 Cấu hình

### 1. File `.env`

Tất cả cấu hình Supabase được lưu trong file `.env` ở thư mục gốc của project:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://yydxhcvxkmxbohqtbbvw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Cấu trúc file cấu hình

```
src/
├── config/
│   └── supabase.ts          # Cấu hình Supabase tập trung (MỚI)
└── services/
    └── supabaseClient.ts    # Re-export từ config (tương thích cũ)
```

## 📁 Các file sử dụng Supabase

### Frontend (React)
- `src/config/supabase.ts` - **File cấu hình chính** (sử dụng file này)
- `src/services/supabaseClient.ts` - Re-export từ config (tương thích)
- `src/services/api.ts` - API services
- Tất cả các pages/components import từ `supabaseClient.ts`

### Backend (Node.js)
- `simple-backend-server.js` - Backend API server
- `windows-printer-server/printer-server.js` - Printer server

## 🔄 Cách cập nhật cấu hình

### Cách 1: Sử dụng script tự động (Khuyến nghị)

```bash
node update-supabase-config.js
```

Script này sẽ tự động cập nhật file `.env` với thông tin mới.

### Cách 2: Cập nhật thủ công

1. Mở file `.env` trong thư mục gốc
2. Cập nhật các giá trị:
   ```env
   REACT_APP_SUPABASE_URL=<URL mới>
   REACT_APP_SUPABASE_ANON_KEY=<Anon key mới>
   SUPABASE_SERVICE_KEY=<Service key mới>
   ```
3. Lưu file
4. Khởi động lại ứng dụng

## ✅ Kiểm tra cấu hình

### Kiểm tra kết nối

```bash
node check-tables-connection.js
```

Script này sẽ:
- Kiểm tra kết nối Supabase
- Đếm số lượng bàn
- Hiển thị danh sách bàn
- Kiểm tra cấu trúc bảng

### Kiểm tra trong code

Trong development mode, console sẽ hiển thị:
```
📡 Supabase Configuration:
   url: https://yydxhcvxkmxbohqtbbvw.supabase.co
   anonKey: eyJhbG...XXXXXX
   isConfigured: true
```

## 🔐 Bảo mật

### Anon Key vs Service Key

- **Anon Key**: Sử dụng cho frontend, bị giới hạn bởi RLS (Row Level Security)
- **Service Key**: Sử dụng cho backend, bypass RLS, **KHÔNG** được commit lên git

### Lưu ý

1. **KHÔNG** commit file `.env` lên git
2. **KHÔNG** hardcode keys trong code
3. Luôn sử dụng environment variables
4. Service key chỉ dùng trong backend, không dùng trong frontend

## 🚀 Sử dụng trong code

### Frontend (React/TypeScript)

```typescript
// Cách 1: Import từ config (khuyến nghị)
import { supabase } from '../config/supabase';

// Cách 2: Import từ services (tương thích cũ)
import { supabase } from '../services/supabaseClient';

// Sử dụng
const { data, error } = await supabase
  .from('tables')
  .select('*');
```

### Backend (Node.js)

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
```

## 📝 Các biến môi trường

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `REACT_APP_SUPABASE_URL` | URL của Supabase project | ✅ |
| `REACT_APP_SUPABASE_ANON_KEY` | Anon key (public) | ✅ |
| `SUPABASE_SERVICE_KEY` | Service key (private, chỉ backend) | ⚠️ |

## 🔍 Troubleshooting

### Lỗi: Missing Supabase configuration

**Nguyên nhân:** File `.env` không có hoặc thiếu biến môi trường

**Giải pháp:**
1. Kiểm tra file `.env` có tồn tại không
2. Đảm bảo có đầy đủ `REACT_APP_SUPABASE_URL` và `REACT_APP_SUPABASE_ANON_KEY`
3. Khởi động lại ứng dụng

### Lỗi: Could not find the table

**Nguyên nhân:** Bảng không tồn tại hoặc RLS đang bật

**Giải pháp:**
1. Kiểm tra bảng có tồn tại trong Supabase không
2. Kiểm tra RLS policies
3. Thử với service_role key (chỉ backend)

### Lỗi: Permission denied

**Nguyên nhân:** RLS (Row Level Security) đang chặn truy cập

**Giải pháp:**
1. Tắt RLS cho bảng (không khuyến nghị cho production)
2. Tạo RLS policies phù hợp
3. Sử dụng service_role key cho backend operations

## 📚 Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Cập nhật lần cuối:** 2025-01-XX







