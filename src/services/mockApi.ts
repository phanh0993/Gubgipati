import { AxiosResponse } from 'axios';
import type { Employee, Customer, Payroll } from '../types/index';

// Mock API for development/demo purposes
export const mockAPI = {
  // Mock login endpoint
  login: async (credentials: { username: string; password: string }): Promise<AxiosResponse<any>> => {
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
      },
      {
        id: 4,
        username: 'ly',
        password: '',
        email: 'ly@gubgipati.com',
        full_name: 'Lý Nhân Viên',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 5,
        username: 'nhanvien1',
        password: '',
        email: 'nhanvien1@gubgipati.com',
        full_name: 'Nhân Viên 1',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Find user by username only (password can be empty for mobile)
    const user = mockUsers.find(u => u.username === credentials.username);

    if (!user) {
      console.log('User not found:', credentials.username);
      throw new Error('Invalid credentials');
    }

    // For mobile login, allow empty password or any password
    // For desktop login, still require correct password
    const isMobileLogin = credentials.password === '' || credentials.password === undefined;
    const isCorrectPassword = user.password === credentials.password;
    
    console.log('Login attempt:', {
      username: credentials.username,
      password: credentials.password,
      isMobileLogin,
      isCorrectPassword,
      userPassword: user.password
    });
    
    // Allow login if:
    // 1. Mobile login (empty password) - always allow
    // 2. Desktop login with correct password
    if (!isMobileLogin && !isCorrectPassword) {
      console.log('Login failed: incorrect password');
      throw new Error('Invalid credentials');
    }
    
    console.log('Login successful for user:', user.username);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    const mockResponse: AxiosResponse<any> = {
      data: {
        user: userWithoutPassword,
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        message: 'Login successful'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    
    return mockResponse;
  },

  // Mock get user profile
  getMe: async (token: string): Promise<AxiosResponse<any>> => {
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

    const mockResponse: AxiosResponse<any> = {
      data: { user },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    return mockResponse;
  },

  

  // Mock dashboard data
  getDashboard: async (): Promise<AxiosResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockResponse: AxiosResponse<any> = {
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
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    return mockResponse;
  },

  // Mock buffet packages
  getBuffetPackages: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        {
          id: 1,
          name: 'Buffet Cơ Bản',
          description: 'Buffet cơ bản với các món ăn phổ biến',
          price: 299000,
          duration_minutes: 90,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Buffet Cao Cấp',
          description: 'Buffet cao cấp với các món ăn đặc biệt',
          price: 499000,
          duration_minutes: 120,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Buffet Trẻ Em',
          description: 'Buffet dành cho trẻ em',
          price: 199000,
          duration_minutes: 90,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  // Mock food items
  getFoodItems: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Phở bò truyền thống Việt Nam',
          price: 65000,
          category_id: 1,
          image_url: '',
          is_available: true,
          printer_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Cơm Gà',
          description: 'Cơm gà Hải Nam',
          price: 45000,
          category_id: 1,
          image_url: '',
          is_available: true,
          printer_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Bún Bò Huế',
          description: 'Bún bò Huế cay nồng',
          price: 55000,
          category_id: 1,
          image_url: '',
          is_available: true,
          printer_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'Bánh Mì',
          description: 'Bánh mì thịt nướng',
          price: 25000,
          category_id: 2,
          image_url: '',
          is_available: true,
          printer_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 5,
          name: 'Chả Cá',
          description: 'Chả cá Lã Vọng',
          price: 85000,
          category_id: 1,
          image_url: '',
          is_available: true,
          printer_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  getBuffetPackageById: async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const packages = [
      {
        id: 1,
        name: 'Buffet Cơ Bản',
        description: 'Buffet cơ bản với các món ăn phổ biến',
        price: 299000,
        duration_minutes: 90,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Buffet Cao Cấp',
        description: 'Buffet cao cấp với các món ăn đặc biệt',
        price: 499000,
        duration_minutes: 120,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'Buffet Trẻ Em',
        description: 'Buffet dành cho trẻ em',
        price: 199000,
        duration_minutes: 90,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
    
    const packageData = packages.find(pkg => pkg.id === id) || packages[0];
    
    return {
      data: packageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  // Mock buffet package items
  getBuffetPackageItems: async (packageId: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const packageItems = {
      1: [
        {
          id: 1,
          package_id: 1,
          food_item_id: 1,
          is_unlimited: true,
          max_quantity: null,
          food_item: {
            id: 1,
            name: 'Phở Bò',
            description: 'Phở bò truyền thống Việt Nam',
            price: 65000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        },
        {
          id: 2,
          package_id: 1,
          food_item_id: 2,
          is_unlimited: true,
          max_quantity: null,
          food_item: {
            id: 2,
            name: 'Cơm Gà',
            description: 'Cơm gà Hải Nam',
            price: 45000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        }
      ],
      2: [
        {
          id: 3,
          package_id: 2,
          food_item_id: 1,
          is_unlimited: true,
          max_quantity: null,
          food_item: {
            id: 1,
            name: 'Phở Bò',
            description: 'Phở bò truyền thống Việt Nam',
            price: 65000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        },
        {
          id: 4,
          package_id: 2,
          food_item_id: 3,
          is_unlimited: true,
          max_quantity: null,
          food_item: {
            id: 3,
            name: 'Bún Bò Huế',
            description: 'Bún bò Huế cay nồng',
            price: 55000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        },
        {
          id: 5,
          package_id: 2,
          food_item_id: 5,
          is_unlimited: true,
          max_quantity: null,
          food_item: {
            id: 5,
            name: 'Chả Cá',
            description: 'Chả cá Lã Vọng',
            price: 85000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        }
      ],
      3: [
        {
          id: 6,
          package_id: 3,
          food_item_id: 2,
          is_unlimited: false,
          max_quantity: 1,
          food_item: {
            id: 2,
            name: 'Cơm Gà',
            description: 'Cơm gà Hải Nam',
            price: 45000,
            category_id: 1,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        },
        {
          id: 7,
          package_id: 3,
          food_item_id: 4,
          is_unlimited: false,
          max_quantity: 2,
          food_item: {
            id: 4,
            name: 'Bánh Mì',
            description: 'Bánh mì thịt nướng',
            price: 25000,
            category_id: 2,
            image_url: '',
            is_available: true,
            printer_id: 1
          }
        }
      ]
    };
    
    return {
      data: packageItems[packageId as keyof typeof packageItems] || [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  // Mock tables
  getTables: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        {
          id: 1,
          table_number: 'A01',
          table_name: 'Bàn A01',
          position_x: 100,
          position_y: 100,
          capacity: 4,
          area: 'A',
          status: 'empty',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          table_number: 'A02',
          table_name: 'Bàn A02',
          position_x: 200,
          position_y: 100,
          capacity: 6,
          area: 'A',
          status: 'empty',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          table_number: 'B01',
          table_name: 'Bàn B01',
          position_x: 100,
          position_y: 200,
          capacity: 4,
          area: 'B',
          status: 'empty',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          table_number: 'B02',
          table_name: 'Bàn B02',
          position_x: 200,
          position_y: 200,
          capacity: 8,
          area: 'B',
          status: 'empty',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  // Mock orders
  getOrders: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
  },

  // Mock customers
  getCustomers: async (): Promise<AxiosResponse<Customer[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response: AxiosResponse<Customer[]> = {
      data: ([
        {
          id: 1,
          fullname: 'Nguyễn Văn An',
          full_name: 'Nguyễn Văn An',
          email: 'nguyenvanan@email.com',
          phone: '0901234567',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          date_of_birth: '1990-01-15',
          gender: 'male',
          notes: 'Khách hàng VIP',
          loyalty_points: 100,
          total_spent: 5000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          fullname: 'Trần Thị Bình',
          full_name: 'Trần Thị Bình',
          email: 'tranthibinh@email.com',
          phone: '0912345678',
          address: '456 Đường XYZ, Quận 3, TP.HCM',
          date_of_birth: '1985-05-20',
          gender: 'female',
          notes: '',
          loyalty_points: 50,
          total_spent: 2500000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ] as unknown as Customer[]),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    return response;
  },

  // Mock employees
  getEmployees: async (): Promise<AxiosResponse<Employee[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response: AxiosResponse<Employee[]> = {
      data: ([
        {
          id: 1,
          user_id: 1,
          username: 'levancuong',
          fullname: 'Lê Văn Cường',
          full_name: 'Lê Văn Cường',
          email: 'levancuong@company.com',
          phone: '0923456789',
          address: '789 Đường DEF, Quận 5, TP.HCM',
          employee_code: 'EMP001',
          position: 'Quản lý',
          department: 'Quản lý',
          hire_date: '2023-01-01',
          salary: 15000000,
          base_salary: 15000000,
          commission_rate: 0.05,
          skills: [],
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          user_id: 2,
          username: 'phamthidieu',
          fullname: 'Phạm Thị Diệu',
          full_name: 'Phạm Thị Diệu',
          email: 'phamthidieu@company.com',
          phone: '0934567890',
          address: '321 Đường GHI, Quận 7, TP.HCM',
          employee_code: 'EMP002',
          position: 'Nhân viên phục vụ',
          department: 'Phục vụ',
          hire_date: '2023-06-01',
          salary: 8000000,
          base_salary: 8000000,
          commission_rate: 0.03,
          skills: [],
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ] as unknown as Employee[]),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    return response;
  },

  // Mock payroll
  getPayroll: async (): Promise<AxiosResponse<Payroll[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response: AxiosResponse<Payroll[]> = {
      data: ([
        {
          id: 1,
          employee_id: 1,
          employee_name: 'Lê Văn Cường',
          employee_code: 'EMP001',
          pay_period_start: '2024-01-01',
          pay_period_end: '2024-01-31',
          base_salary: 15000000,
          commission_total: 500000,
          bonus_amount: 2000000,
          deduction_amount: 500000,
          gross_pay: 17500000,
          net_pay: 17000000,
          pay_status: 'paid',
          pay_date: '2024-02-01',
          notes: '',
          created_at: '2024-01-31T00:00:00Z',
          updated_at: '2024-01-31T00:00:00Z'
        },
        {
          id: 2,
          employee_id: 2,
          employee_name: 'Phạm Thị Diệu',
          employee_code: 'EMP002',
          pay_period_start: '2024-01-01',
          pay_period_end: '2024-01-31',
          base_salary: 8000000,
          commission_total: 300000,
          bonus_amount: 1000000,
          deduction_amount: 200000,
          gross_pay: 9300000,
          net_pay: 9100000,
          pay_status: 'paid',
          pay_date: '2024-02-01',
          notes: '',
          created_at: '2024-01-31T00:00:00Z',
          updated_at: '2024-01-31T00:00:00Z'
        }
      ] as unknown as Payroll[]),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    return response;
  }
};
