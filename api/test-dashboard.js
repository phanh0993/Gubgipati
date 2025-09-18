module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return simple dashboard data without authentication
  const dashboardData = {
    stats: {
      today: {
        revenue: 1500000,
        invoices: 5,
        customers: 3,
        appointments: 8
      },
      totals: {
        customers: 150,
        employees: 10,
        services: 25,
        monthlyRevenue: 45000000
      }
    },
    revenueChart: [
      { name: 'T2', revenue: 2000000 },
      { name: 'T3', revenue: 3500000 },
      { name: 'T4', revenue: 1800000 },
      { name: 'T5', revenue: 4200000 },
      { name: 'T6', revenue: 5100000 },
      { name: 'T7', revenue: 2800000 },
      { name: 'CN', revenue: 1900000 }
    ],
    topServices: [
      { name: 'Massage thư giãn', revenue: 15000000, count: 45 },
      { name: 'Chăm sóc da mặt', revenue: 12000000, count: 38 },
      { name: 'Tắm trắng', revenue: 8500000, count: 25 }
    ],
    employeePerformance: [
      { name: 'Mai Ly', revenue: 8000000, services: 32 },
      { name: 'Thanh Nga', revenue: 6500000, services: 28 },
      { name: 'Minh Châu', revenue: 5200000, services: 24 }
    ],
    todayAppointments: [
      { time: '09:00', customer: 'Nguyễn Thị Hoa', service: 'Massage', employee: 'Mai Ly' },
      { time: '10:30', customer: 'Trần Văn Nam', service: 'Chăm sóc da', employee: 'Thanh Nga' },
      { time: '14:00', customer: 'Lê Thị Mai', service: 'Tắm trắng', employee: 'Minh Châu' }
    ]
  };

  res.json(dashboardData);
};
