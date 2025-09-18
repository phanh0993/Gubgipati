# Hướng dẫn deploy Vercel mới

## Vấn đề hiện tại:
- Vercel deployment trả về DEPLOYMENT_NOT_FOUND
- Cả domain chính và deployment domain đều 404
- Frontend hiển thị nhưng API functions không hoạt động

## Giải pháp:

### Cách 1: Tạo project Vercel mới
1. Vào https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import từ GitHub repository: `https://github.com/phanh0993/julyspa`
4. Đặt tên project: `julyspa-new`
5. Configure Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=july-spa-secret
   NODE_ENV=production
   REACT_APP_API_URL=https://[NEW-DOMAIN]/api
   ```
6. Deploy

### Cách 2: Xóa project cũ và tạo lại
1. Vào project `julyspa` hiện tại
2. Settings → General → Delete Project
3. Tạo lại như Cách 1

### Cách 3: Manual redeploy
1. Vào project `julyspa`
2. Deployments → Click deployment mới nhất
3. Click "Redeploy" 
4. Nếu vẫn lỗi, thử "Redeploy without cache"

## Lưu ý:
- Sau khi có domain mới, cần update REACT_APP_API_URL
- Test với domain mới: `https://[NEW-DOMAIN]/api/test-simple-2`
