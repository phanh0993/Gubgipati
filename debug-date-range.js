const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

function testDateRange() {
  console.log('🔍 Testing date range calculation...\n');

  // Test current time
  const now = dayjs().tz('Asia/Ho_Chi_Minh');
  console.log('📅 Current time (Vietnam):', now.format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('📅 Current time (UTC):', now.utc().format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('');

  // Test today range
  const todayStart = now.startOf('day');
  const todayEnd = now.endOf('day');
  
  console.log('📅 Today range (Vietnam timezone):');
  console.log('   Start:', todayStart.format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('   End:', todayEnd.format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('');

  // Test UTC conversion
  const todayStartUTC = todayStart.utc();
  const todayEndUTC = todayEnd.utc();
  
  console.log('📅 Today range (UTC):');
  console.log('   Start:', todayStartUTC.format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('   End:', todayEndUTC.format('YYYY-MM-DD HH:mm:ss Z'));
  console.log('');

  // Test with actual invoice dates
  const invoiceDates = [
    '2025-09-20T00:54:57.301391',
    '2025-09-20T00:41:43.617868',
    '2025-09-20T00:35:08.12921',
    '2025-09-20T00:22:57.222542',
    '2025-09-19T23:58:26.550595',
    '2025-09-19T23:57:45.659127'
  ];

  console.log('📋 Testing invoice dates:');
  invoiceDates.forEach((dateStr, index) => {
    const invoiceDate = dayjs(dateStr);
    const isInRange = invoiceDate.isAfter(todayStartUTC) && invoiceDate.isBefore(todayEndUTC);
    console.log(`   ${index + 1}. ${dateStr}`);
    console.log(`      Vietnam: ${invoiceDate.tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss Z')}`);
    console.log(`      UTC: ${invoiceDate.utc().format('YYYY-MM-DD HH:mm:ss Z')}`);
    console.log(`      In range: ${isInRange ? '✅' : '❌'}`);
    console.log('');
  });

  // Test alternative approach - filter by date only
  console.log('🔍 Alternative approach - filter by date only:');
  const todayDate = now.format('YYYY-MM-DD');
  console.log('   Today date:', todayDate);
  
  invoiceDates.forEach((dateStr, index) => {
    const invoiceDate = dayjs(dateStr);
    const invoiceDateStr = invoiceDate.format('YYYY-MM-DD');
    const isToday = invoiceDateStr === todayDate;
    console.log(`   ${index + 1}. ${dateStr} -> ${invoiceDateStr} (${isToday ? '✅' : '❌'})`);
  });
}

testDateRange();
