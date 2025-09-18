const db = require('./database');
const bcrypt = require('bcryptjs');

// Sample data
const sampleServices = [
  {
    name: 'Massage toàn thân',
    description: 'Massage thư giãn toàn thân với tinh dầu thiên nhiên',
    price: 300000,
    duration: 90,
    category: 'Massage',
    commission_rate: 15
  },
  {
    name: 'Chăm sóc da mặt cơ bản',
    description: 'Làm sạch, tẩy tế bào chết, đắp mặt nạ',
    price: 200000,
    duration: 60,
    category: 'Chăm sóc da',
    commission_rate: 20
  },
  {
    name: 'Massage foot',
    description: 'Massage chân và bấm huyệt',
    price: 150000,
    duration: 45,
    category: 'Massage',
    commission_rate: 10
  },
  {
    name: 'Tắm trắng toàn thân',
    description: 'Tắm trắng với công nghệ hiện đại',
    price: 500000,
    duration: 120,
    category: 'Chăm sóc da',
    commission_rate: 25
  },
  {
    name: 'Gội đầu dưỡng sinh',
    description: 'Gội đầu thư giãn với thảo dược',
    price: 100000,
    duration: 30,
    category: 'Chăm sóc tóc',
    commission_rate: 12
  }
];

const sampleShifts = [
  { name: 'Ca sáng', start_time: '08:00', end_time: '14:00' },
  { name: 'Ca chiều', start_time: '14:00', end_time: '20:00' },
  { name: 'Ca tối', start_time: '18:00', end_time: '22:00' }
];

const sampleCustomers = [
  {
    fullname: 'Nguyễn Thị Hoa',
    phone: '0901234567',
    email: 'hoa.nguyen@email.com',
    address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    birthday: '1985-05-15',
    gender: 'female',
    notes: 'Khách hàng VIP, thích massage nhẹ nhàng'
  },
  {
    fullname: 'Trần Văn Nam',
    phone: '0987654321',
    email: 'nam.tran@email.com',
    address: '456 Lê Văn Việt, Quận 9, TP.HCM',
    birthday: '1990-12-20',
    gender: 'male',
    notes: 'Thường đặt lịch vào cuối tuần'
  },
  {
    fullname: 'Lê Thị Mai',
    phone: '0912345678',
    email: 'mai.le@email.com',
    address: '789 Võ Văn Tần, Quận 3, TP.HCM',
    birthday: '1988-08-08',
    gender: 'female',
    notes: 'Có da nhạy cảm, cần chú ý khi chăm sóc'
  }
];

function seedData() {
  console.log('🌱 Seeding sample data...');

  // Insert services
  const serviceStmt = db.prepare(`
    INSERT INTO services (name, description, price, duration, category, commission_rate) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleServices.forEach(service => {
    serviceStmt.run(
      service.name,
      service.description,
      service.price,
      service.duration,
      service.category,
      service.commission_rate
    );
  });
  serviceStmt.finalize();
  console.log('✅ Services seeded');

  // Insert shifts
  const shiftStmt = db.prepare(`
    INSERT INTO shifts (name, start_time, end_time) 
    VALUES (?, ?, ?)
  `);

  sampleShifts.forEach(shift => {
    shiftStmt.run(shift.name, shift.start_time, shift.end_time);
  });
  shiftStmt.finalize();
  console.log('✅ Shifts seeded');

  // Insert customers
  const customerStmt = db.prepare(`
    INSERT INTO customers (fullname, phone, email, address, birthday, gender, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  sampleCustomers.forEach(customer => {
    customerStmt.run(
      customer.fullname,
      customer.phone,
      customer.email,
      customer.address,
      customer.birthday,
      customer.gender,
      customer.notes
    );
  });
  customerStmt.finalize();
  console.log('✅ Customers seeded');

  console.log('🎉 Sample data seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
