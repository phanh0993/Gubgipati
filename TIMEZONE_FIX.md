# ✅ Sửa lỗi múi giờ cho bộ lọc hóa đơn

## 🎯 Vấn đề
API đang lọc hóa đơn theo múi giờ UTC thay vì múi giờ Việt Nam (UTC+7), dẫn đến việc lọc sai ngày.

## 🔧 Giải pháp đã thực hiện

### 1. **API Invoices** (`/api/invoices`)
**Trước:**
```sql
WHERE DATE(i.invoice_date) = $1
```

**Sau:**
```sql
WHERE DATE(i.invoice_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1
```

### 2. **API Payroll** (tất cả các file payroll)
**Trước:**
```sql
AND EXTRACT(YEAR FROM i.created_at) = $2
AND EXTRACT(MONTH FROM i.created_at) = $3
```

**Sau:**
```sql
AND EXTRACT(YEAR FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2
AND EXTRACT(MONTH FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3
```

## 📁 Files đã sửa:
1. `api/invoices.js` - Lọc hóa đơn theo ngày
2. `api/payroll.js` - Tính lương theo tháng
3. `api/payroll-temp.js` - API lương tạm thời
4. `api/payroll-noauth.js` - API lương không auth
5. `api/payroll/employee/[id].js` - Lương theo nhân viên

## 🌏 Múi giờ sử dụng
- **Timezone**: `Asia/Ho_Chi_Minh` (UTC+7)
- **Conversion**: `AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'`

## ✅ Kết quả
- Lọc hóa đơn theo ngày chính xác theo giờ Việt Nam
- Tính lương theo tháng đúng múi giờ
- Thống kê dashboard chính xác
- Đồng bộ với frontend hiển thị

## 🧪 Test case
1. **Tạo hóa đơn lúc 23:00 ngày 25/11** (UTC+7)
2. **Lọc hóa đơn ngày 25/11** → Phải hiển thị hóa đơn này
3. **Lọc hóa đơn ngày 24/11** → Không được hiển thị hóa đơn này

---
**🎉 Múi giờ đã được sửa chính xác cho tất cả API!**
