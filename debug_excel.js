const XLSX = require('xlsx');

// Read Excel file
const workbook = XLSX.readFile('./khachhang.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Method 1: Read as objects
console.log('=== Method 1: Default JSON ===');
const jsonData1 = XLSX.utils.sheet_to_json(worksheet);
console.log('First row:', jsonData1[0]);
console.log('Total rows:', jsonData1.length);

// Method 2: Read as arrays
console.log('\n=== Method 2: Array format ===');
const jsonData2 = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('Headers:', jsonData2[0]);
console.log('First data row:', jsonData2[1]);
console.log('Total rows:', jsonData2.length);

// Check for empty rows
let emptyCount = 0;
jsonData1.forEach((row, index) => {
  if (!row['Tên khách hàng'] || !row['Điện thoại']) {
    emptyCount++;
    if (emptyCount <= 5) {
      console.log(`Empty row ${index + 1}:`, {
        name: row['Tên khách hàng'],
        phone: row['Điện thoại']
      });
    }
  }
});

console.log(`\nTotal empty rows: ${emptyCount}`);
console.log(`Valid rows: ${jsonData1.length - emptyCount}`);
