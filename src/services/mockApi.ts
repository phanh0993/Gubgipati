// Mock API for development/demo purposes
export const mockAPI = {
  // Mock login endpoint
  login: async (credentials: { username: string; password: string }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock users
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        email: 'admin@gubgipati.com',
        full_name: 'Administrator',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'manager',
        password: 'manager123',
        email: 'manager@gubgipati.com',
        full_name: 'Manager',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        username: 'staff',
        password: 'staff123',
        email: 'staff@gubgipati.com',
        full_name: 'Staff Member',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const user = mockUsers.find(u => 
      u.username === credentials.username && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return {
      data: {
        user: userWithoutPassword,
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        message: 'Login successful'
      }
    };
  },

  // Mock get user profile
  getMe: async (token: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract user ID from mock token
    const userId = token.includes('mock-jwt-token-1') ? 1 : 
                   token.includes('mock-jwt-token-2') ? 2 : 3;
    
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@gubgipati.com',
        full_name: 'Administrator',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'manager',
        email: 'manager@gubgipati.com',
        full_name: 'Manager',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        username: 'staff',
        email: 'staff@gubgipati.com',
        full_name: 'Staff Member',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      data: { user }
    };
  },

  // Mock employees data
  getEmployees: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1,
        user_id: 1,
        employee_code: 'EMP001',
        full_name: 'Administrator',
        position: 'owner',
        department: 'Management',
        phone: '0123456789',
        email: 'admin@gubgipati.com',
        hire_date: '2024-01-01',
        salary: 50000000,
        is_active: true
      },
      {
        id: 2,
        user_id: 2,
        employee_code: 'EMP002',
        full_name: 'Manager',
        position: 'manager',
        department: 'Operations',
        phone: '0123456790',
        email: 'manager@gubgipati.com',
        hire_date: '2024-01-01',
        salary: 30000000,
        is_active: true
      },
      {
        id: 3,
        user_id: 3,
        employee_code: 'EMP003',
        full_name: 'Staff Member',
        position: 'waiter',
        department: 'Service',
        phone: '0123456791',
        email: 'staff@gubgipati.com',
        hire_date: '2024-01-01',
        salary: 15000000,
        is_active: true
      }
    ];
  },

  // Mock dashboard data
  getDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: {
        totalRevenue: 50000000,
        totalAppointments: 125,
        totalCustomers: 89,
        totalServices: 15,
        revenueGrowth: 12.5,
        appointmentGrowth: 8.3,
        customerGrowth: 15.2,
        serviceGrowth: 5.1,
        revenueChart: [
          { date: '2024-01-01', revenue: 1200000 },
          { date: '2024-01-02', revenue: 1500000 },
          { date: '2024-01-03', revenue: 1800000 },
          { date: '2024-01-04', revenue: 1400000 },
          { date: '2024-01-05', revenue: 1600000 },
          { date: '2024-01-06', revenue: 2000000 },
          { date: '2024-01-07', revenue: 1900000 }
        ],
        topServices: [
          { name: 'Massage toàn thân', revenue: 15000000, bookings: 45 },
          { name: 'Chăm sóc da mặt', revenue: 12000000, bookings: 38 },
          { name: 'Tắm trắng', revenue: 8000000, bookings: 25 }
        ],
        employeePerformance: [
          { name: 'Nguyễn Văn A', revenue: 8000000, appointments: 25 },
          { name: 'Trần Thị B', revenue: 7500000, appointments: 23 },
          { name: 'Lê Văn C', revenue: 6800000, appointments: 20 }
        ]
      }
    };
  }
};
