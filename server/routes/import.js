const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Import customers from Excel
router.post('/customers', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    });

    console.log('Excel headers:', jsonData[0]); // Log headers
    console.log('Excel data sample:', jsonData[1]); // Log first data row

    // Convert array format to object format
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);
    
    const processedData = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    processedData.forEach((row, index) => {
      try {
        // Helper function to find column value with multiple possible names
        const getColumnValue = (possibleNames) => {
          for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== '') {
              return row[name];
            }
          }
          return '';
        };

        // Map Excel columns to our database fields (using exact column names from the Excel file)
        const customerData = {
          fullname: row['Tên khách hàng'] || '',
          phone: row['Điện thoại'] || '',
          email: row['Email'] || '',
          address: row['Địa chỉ'] || '',
          birthday: parseDate(row['Ngày sinh']), // This column might not exist in current file
          gender: parseGender(row['Giới tính']),
          notes: row['Ghi chú'] || '',
          customer_code: row['Mã khách hàng'] || '',
          company: row['Công ty'] || '',
          tax_code: row['Mã số thuế'] || '',
          source: row['Nguồn khách'] || '',
          facebook: row['Facebook'] || '',
          customer_group: row['Nhóm khách hàng'] || '',
          branch: row['Chi nhánh'] || '',
          area: row['Khu vực'] || '',
          ward: row['Phường/Xã'] || '',
          total_spent: parseFloat(row['Tổng bán'] || 0),
          loyalty_points: Math.floor(parseFloat(row['Tổng bán'] || 0) / 100000), // 1 point per 100k VND
          last_transaction: parseDate(row['Ngày giao dịch cuối']),
          debt_amount: parseFloat(row['Nợ cần thu hiện tại'] || 0),
          card_balance: parseFloat(row['Số dư thẻ TK'] || 0),
          service_sessions: parseInt(row['Số buổi còn lại gói DV, liệu trình'] || 0),
          status: row['Trạng thái'] == 1 ? 'active' : 'inactive',
          customer_type: row['Loại khách'] || '',
          created_by: row['Tài khoản tạo'] || '',
          created_date: parseDate(row['Ngày tạo'])
        };

        // Debug log for first few rows
        if (index < 3) {
          console.log(`Row ${index + 2} data:`, {
            fullname: customerData.fullname,
            phone: customerData.phone,
            raw_fullname: row['Tên khách hàng'],
            raw_phone: row['Điện thoại']
          });
        }

        // Validate required fields (only fullname is required)
        if (!customerData.fullname) {
          errors.push(`Row ${index + 2}: Missing required field 'Tên khách hàng'`);
          errorCount++;
          return;
        }

        // Skip rows with empty phone (but keep the name for reference)
        if (!customerData.phone || customerData.phone.trim() === '') {
          errors.push(`Row ${index + 2}: Skipped - missing phone number for '${customerData.fullname}'`);
          errorCount++;
          return;
        }

        // Insert into database
        db.run(
          `INSERT INTO customers (
            fullname, phone, email, address, birthday, gender, notes,
            customer_code, company, tax_code, source, facebook, customer_group,
            branch, area, ward, total_spent, loyalty_points, last_transaction,
            debt_amount, card_balance, service_sessions, status,
            customer_type, created_by, created_date,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            customerData.fullname,
            customerData.phone,
            customerData.email,
            customerData.address,
            customerData.birthday,
            customerData.gender,
            customerData.notes,
            customerData.customer_code,
            customerData.company,
            customerData.tax_code,
            customerData.source,
            customerData.facebook,
            customerData.customer_group,
            customerData.branch,
            customerData.area,
            customerData.ward,
            customerData.total_spent,
            customerData.loyalty_points,
            customerData.last_transaction,
            customerData.debt_amount,
            customerData.card_balance,
            customerData.service_sessions,
            customerData.status,
            customerData.customer_type,
            customerData.created_by,
            customerData.created_date
          ],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                // Try to update existing customer instead of insert
                db.run(
                  `UPDATE customers SET 
                   fullname = ?, email = ?, address = ?, birthday = ?, gender = ?, notes = ?,
                   customer_code = ?, company = ?, tax_code = ?, source = ?, facebook = ?, 
                   customer_group = ?, branch = ?, area = ?, ward = ?, total_spent = ?, 
                   loyalty_points = ?, last_transaction = ?, debt_amount = ?, card_balance = ?, 
                   service_sessions = ?, status = ?, customer_type = ?, created_by = ?, 
                   created_date = ?, updated_at = datetime('now')
                   WHERE phone = ?`,
                  [
                    customerData.fullname, customerData.email, customerData.address,
                    customerData.birthday, customerData.gender, customerData.notes,
                    customerData.customer_code, customerData.company, customerData.tax_code,
                    customerData.source, customerData.facebook, customerData.customer_group,
                    customerData.branch, customerData.area, customerData.ward,
                    customerData.total_spent, customerData.loyalty_points, customerData.last_transaction,
                    customerData.debt_amount, customerData.card_balance, customerData.service_sessions,
                    customerData.status, customerData.customer_type, customerData.created_by,
                    customerData.created_date, customerData.phone
                  ],
                  function(updateErr) {
                    if (updateErr) {
                      errors.push(`Row ${index + 2}: ${updateErr.message}`);
                      errorCount++;
                    } else {
                      successCount++;
                    }
                  }
                );
              } else {
                errors.push(`Row ${index + 2}: ${err.message}`);
                errorCount++;
              }
            } else {
              successCount++;
            }
          }
        );

      } catch (error) {
        errors.push(`Row ${index + 2}: ${error.message}`);
        errorCount++;
      }
    });

    // Clean up uploaded file
    setTimeout(() => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }, 5000);

    res.json({
      message: 'Import completed',
      total: processedData.length,
      success: successCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10) // Return first 10 errors only
    });

  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: error.message 
    });
  }
});

// Helper functions
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Handle Excel date serial numbers
    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates
    if (typeof dateStr === 'string') {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function parseGender(genderStr) {
  if (!genderStr) return null;
  
  const str = genderStr.toString().toLowerCase();
  if (str.includes('nam') || str.includes('male') || str === 'm') {
    return 'male';
  } else if (str.includes('nữ') || str.includes('nu') || str.includes('female') || str === 'f') {
    return 'female';
  }
  
  return null;
}

module.exports = router;
