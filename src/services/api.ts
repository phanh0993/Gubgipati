import axios, { AxiosResponse } from 'axios';
import {
  User, LoginRequest, AuthResponse,
  Service, Customer, Employee, Appointment, Invoice, Payroll,
  DashboardOverview, RevenueChartData, TopService, EmployeePerformance,
  CustomerFilters, InvoiceFilters, AppointmentFilters,
  CreateInvoiceRequest, Shift, Schedule
} from '../types';
import { mockAPI } from './mockApi';
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL?.includes('localhost');
const USE_SUPABASE = IS_PRODUCTION && !!process.env.REACT_APP_SUPABASE_URL && !!process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is a remember login that should be preserved
      const remember = localStorage.getItem('spa_remember') === 'true';
      const expiry = localStorage.getItem('spa_token_expiry');
      const now = new Date().getTime();
      
      if (remember && expiry && now < parseInt(expiry)) {
        // Token is still valid according to our local expiry, but server rejected it
        // This might be a temporary server issue, don't logout immediately
        console.warn('Token rejected by server but should be valid, keeping session');
        return Promise.reject(error);
      }
      
      // Clear all auth data and redirect to login
      localStorage.removeItem('spa_token');
      localStorage.removeItem('spa_user');
      localStorage.removeItem('spa_token_expiry');
      localStorage.removeItem('spa_remember');
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> => {
    if (IS_PRODUCTION) {
      return mockAPI.login(data);
    }
    return api.post('/auth/login', data);
  },
    
  setup: (data: any): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/setup', data),
    
  getMe: (): Promise<AxiosResponse<{ user: User }>> => {
    if (IS_PRODUCTION) {
      const token = localStorage.getItem('spa_token') || '';
      return mockAPI.getMe(token);
    }
    return api.get('/auth/me');
  },
    
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<any>> =>
    api.put('/auth/change-password', data),
};

// Services API
export const servicesAPI = {
  getAll: (params?: { category?: string; active?: boolean }): Promise<AxiosResponse<{ services: Service[] }>> =>
    api.get('/services', { params }),
    
  getById: (id: number): Promise<AxiosResponse<{ service: Service }>> =>
    api.get(`/services/${id}`),
    
  create: (data: Partial<Service>): Promise<AxiosResponse<{ service: Service; message: string }>> =>
    api.post('/services', data),
    
  update: (id: number, data: Partial<Service>): Promise<AxiosResponse<{ service: Service; message: string }>> =>
    api.put(`/services/${id}`, data),
    
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/services/${id}`),
    
  getCategories: (): Promise<AxiosResponse<{ categories: string[] }>> =>
    api.get('/services/categories/list'),
};

// Customers API
export const customersAPI = {
  getAll: (params: CustomerFilters): Promise<AxiosResponse<{ customers: Customer[]; total: number; limit: number; offset: number }>> =>
    api.get('/customers', { params }),
    
  getById: (id: number): Promise<AxiosResponse<{ customer: Customer; history: any[] }>> =>
    api.get(`/customers/${id}`),
    
  create: (data: Partial<Customer>): Promise<AxiosResponse<{ customer: Customer; message: string }>> =>
    api.post('/customers', data),
    
  update: (id: number, data: Partial<Customer>): Promise<AxiosResponse<{ customer: Customer; message: string }>> =>
    api.put(`/customers/${id}`, data),
    
  delete: (id: number, force?: boolean): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/customers/${id}${force ? '?force=true' : ''}`),
    
  searchByPhone: (phone: string): Promise<AxiosResponse<{ customer: Customer | null }>> =>
    api.get(`/customers/search/phone/${phone}`),
    
  getVIP: (limit?: number): Promise<AxiosResponse<{ vipCustomers: Customer[] }>> =>
    api.get('/customers/stats/vip', { params: { limit } }),
};

// Employees API
export const employeesAPI = {
  getAll: (params?: { active?: boolean; position?: string }): Promise<AxiosResponse<{ employees: Employee[] }>> =>
    api.get('/employees', { params }),
    
  getById: (id: number): Promise<AxiosResponse<{ employee: Employee; stats: any }>> =>
    api.get(`/employees/${id}`),
    
  create: (data: any): Promise<AxiosResponse<{ employee: Employee; message: string }>> =>
    api.post('/employees', data),
    
  update: (id: number, data: Partial<Employee>): Promise<AxiosResponse<{ employee: Employee; message: string }>> =>
    api.put(`/employees/${id}`, data),
    
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/employees/${id}`),
    
  getRevenue: (id: number, params?: { start_date?: string; end_date?: string; limit?: number }): Promise<AxiosResponse<{ revenue: any[] }>> =>
    api.get(`/employees/${id}/revenue`, { params }),
    
  getPositions: (): Promise<AxiosResponse<{ positions: string[] }>> =>
    api.get('/employees/positions/list'),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params: AppointmentFilters): Promise<AxiosResponse<{ appointments: Appointment[] }>> =>
    api.get('/appointments', { params }),
    
  getById: (id: number): Promise<AxiosResponse<{ appointment: Appointment }>> =>
    api.get(`/appointments/${id}`),
    
  getCalendar: (date: string): Promise<AxiosResponse<{ appointments: Appointment[] }>> =>
    api.get(`/appointments/calendar/${date}`),
    
  create: (data: Partial<Appointment>): Promise<AxiosResponse<{ appointment: Appointment; message: string }>> =>
    api.post('/appointments', data),
    
  update: (id: number, data: Partial<Appointment>): Promise<AxiosResponse<{ appointment: Appointment; message: string }>> =>
    api.put(`/appointments/${id}`, data),
    
  cancel: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/appointments/${id}`),
    
  getAvailableSlots: (employeeId: number, date: string, duration?: number): Promise<AxiosResponse<{ availableSlots: any[] }>> =>
    api.get(`/appointments/employee/${employeeId}/available-slots`, { params: { date, duration } }),
};

// Schedules API
export const schedulesAPI = {
  getShifts: (): Promise<AxiosResponse<{ shifts: Shift[] }>> =>
    api.get('/schedules/shifts'),
    
  createShift: (data: Partial<Shift>): Promise<AxiosResponse<{ shift: Shift; message: string }>> =>
    api.post('/schedules/shifts', data),
    
  updateShift: (id: number, data: Partial<Shift>): Promise<AxiosResponse<{ shift: Shift; message: string }>> =>
    api.put(`/schedules/shifts/${id}`, data),
    
  getAll: (params?: { employee_id?: number; work_date?: string; start_date?: string; end_date?: string }): Promise<AxiosResponse<{ schedules: Schedule[] }>> =>
    api.get('/schedules', { params }),
    
  getWeek: (date: string): Promise<AxiosResponse<{ schedules: Schedule[]; week_start: string; week_end: string }>> =>
    api.get(`/schedules/week/${date}`),
    
  create: (data: Partial<Schedule>): Promise<AxiosResponse<{ schedule: Schedule; message: string }>> =>
    api.post('/schedules', data),
    
  createBulk: (data: { schedules: any[] }): Promise<AxiosResponse<any>> =>
    api.post('/schedules/bulk', data),
    
  update: (id: number, data: Partial<Schedule>): Promise<AxiosResponse<{ schedule: Schedule; message: string }>> =>
    api.put(`/schedules/${id}`, data),
    
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/schedules/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params: InvoiceFilters): Promise<AxiosResponse<{ invoices: Invoice[]; total: number; limit: number; offset: number }>> => {
    if (USE_SUPABASE) {
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      return new Promise((resolve, reject) => {
        supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .order('invoice_date', { ascending: false })
          .range(offset, offset + limit - 1)
          .then((res: any) => {
            const axiosLike = {
              data: {
                invoices: (res.data || []) as any,
                total: res.count || 0,
                limit,
                offset,
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as any,
            } as AxiosResponse<{ invoices: Invoice[]; total: number; limit: number; offset: number }>;
            resolve(axiosLike);
          })
          .catch(reject);
      });
    }
    return api.get('/invoices', { params });
  },
    
  getById: (id: number): Promise<AxiosResponse<{ invoice: Invoice; items: any[] }>> =>
    api.get(`/invoices/${id}`),
    
  create: (data: CreateInvoiceRequest): Promise<AxiosResponse<{ invoice: Invoice; items: any[]; message: string }>> =>
    api.post('/invoices', data),
    
  update: (id: number, data: Partial<Invoice>): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/invoices/${id}`, data),
    
  updatePayment: (id: number, data: { payment_status: string; payment_method?: string }): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/invoices/${id}/payment`, data),
    
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/invoices/${id}`),
    
  getStats: (params?: { start_date?: string; end_date?: string; limit?: number }): Promise<AxiosResponse<{ stats: any[] }>> =>
    api.get('/invoices/stats/daily', { params }),
};


// Dashboard API
export const dashboardAPI = {
  getOverview: (date?: string): Promise<AxiosResponse<DashboardOverview>> => {
    if (IS_PRODUCTION) {
      return mockAPI.getDashboard();
    }
    return api.get('/dashboard', { params: { date } });
  },
    
  getRevenueChart: (days?: number): Promise<AxiosResponse<{ chartData: RevenueChartData[] }>> =>
    api.get('/dashboard/revenue-chart', { params: { days } }),
    
  getTopServices: (limit?: number, days?: number): Promise<AxiosResponse<{ topServices: TopService[] }>> =>
    api.get('/dashboard/top-services', { params: { limit, days } }),
    
  getEmployeePerformance: (limit?: number, days?: number): Promise<AxiosResponse<{ employeePerformance: EmployeePerformance[] }>> =>
    api.get('/dashboard/employee-performance', { params: { limit, days } }),
    
  getVIPCustomers: (limit?: number): Promise<AxiosResponse<{ vipCustomers: any[] }>> =>
    api.get('/dashboard/vip-customers', { params: { limit } }),
    
  getTodayAppointments: (date?: string): Promise<AxiosResponse<{ todayAppointments: Appointment[] }>> =>
    api.get('/dashboard/today-appointments', { params: { date } }),
    
  getMonthlyRevenue: (year?: number, months?: number): Promise<AxiosResponse<{ monthlyRevenue: any[] }>> =>
    api.get('/dashboard/monthly-revenue', { params: { year, months } }),
    
  getShiftStats: (date?: string): Promise<AxiosResponse<{ shiftStats: any[] }>> =>
    api.get('/dashboard/shift-stats', { params: { date } }),
    
  getFinancialSummary: (start_date: string, end_date: string): Promise<AxiosResponse<{ financialSummary: any }>> =>
    api.get('/dashboard/financial-summary', { params: { start_date, end_date } }),
    
  getNewCustomers: (days?: number, limit?: number): Promise<AxiosResponse<{ newCustomers: any[] }>> =>
    api.get('/dashboard/new-customers', { params: { days, limit } }),

  getDailyInvoices: (date?: string): Promise<AxiosResponse<{ 
    date: string; 
    invoices: any[]; 
    total_revenue: number; 
    total_invoices: number; 
  }>> =>
    api.get('/dashboard', { params: { date } }),
};

export const overtimeAPI = {
  getOvertimeRecords: (
    employeeId: number,
    month: string
  ): Promise<AxiosResponse<{
    success: boolean;
    overtime_records: any[];
    total_overtime_amount: number;
    count: number;
  }>> =>
    api.get('/overtime', { params: { employee_id: employeeId, month } }),

  addOvertimeRecord: (data: {
    employee_id: number;
    date: string;
    hours: number;
    notes?: string;
  }): Promise<AxiosResponse<{
    success: boolean;
    overtime: any;
    message: string;
  }>> =>
    api.post('/overtime', data),

  deleteOvertimeRecord: (
    id: number
  ): Promise<AxiosResponse<{
    success: boolean;
    message: string;
  }>> =>
    api.delete(`/overtime?id=${id}`),
};

// Customer API
export const customerAPI = {
  getCustomers: (): Promise<AxiosResponse<Customer[]>> => {
    if (IS_PRODUCTION) {
      return mockAPI.getCustomers();
    }
    return api.get('/customers');
  },
};

// Employee API
export const employeeAPI = {
  getEmployees: (): Promise<AxiosResponse<Employee[]>> => {
    if (IS_PRODUCTION) {
      return mockAPI.getEmployees();
    }
    return api.get('/employees');
  },
};

// Payroll API
export const payrollAPI = {
  getPayroll: (): Promise<AxiosResponse<Payroll[]>> => {
    if (IS_PRODUCTION) {
      return mockAPI.getPayroll();
    }
    return api.get('/payroll');
  },
};

// Buffet API
export const buffetAPI = {
  getPackages: (): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return supabase
        .from('buffet_packages')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .then((res: any) => ({ data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any }));
    }
    if (IS_PRODUCTION) {
      return mockAPI.getBuffetPackages();
    }
    return api.get('/buffet-packages');
  },
  
  getPackageItems: (packageId: number): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return supabase
        .from('buffet_package_items')
        .select('*, food_item:food_items(*)')
        .eq('package_id', packageId)
        .then((res: any) => ({ data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any }));
    }
    if (IS_PRODUCTION) {
      return mockAPI.getBuffetPackageItems(packageId);
    }
    return api.get(`/buffet-package-items?package_id=${packageId}`);
  },
  
  getFoodItems: (): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return supabase
        .from('food_items')
        .select('*')
        .eq('is_available', true)
        .order('id', { ascending: true })
        .then((res: any) => ({ data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any }));
    }
    if (IS_PRODUCTION) {
      return mockAPI.getFoodItems();
    }
    return api.get('/food-items');
  },
};

// Table API
export const tableAPI = {
  getTables: (): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return supabase
        .from('tables')
        .select('*')
        .order('id', { ascending: true })
        .then((res: any) => ({ data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any }));
    }
    if (IS_PRODUCTION) {
      return mockAPI.getTables();
    }
    return api.get('/tables');
  },
};

// Order API
export const orderAPI = {
  getOrders: (params?: any): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} as any });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getOrders();
    }
    return api.get('/orders', { params });
  },
};

export default api;
