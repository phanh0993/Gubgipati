// API Response types
export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
}

// User & Auth types
export interface User {
  id: number;
  username: string;
  fullname: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Service types
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Customer types
export interface Customer {
  id: number;
  name?: string; // For API compatibility
  fullname: string;
  phone?: string;
  email?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  notes?: string;
  loyalty_points: number;
  total_spent: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerHistory {
  id: number;
  customer_id: number;
  invoice_id?: number;
  service_name: string;
  employee_name?: string;
  amount: number;
  visit_date: string;
  notes?: string;
  created_at: string;
}

// Employee types
export interface Employee {
  id: number;
  user_id: number;
  username: string;
  password?: string; // For creating/updating employees
  name?: string; // For API compatibility
  fullname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  employee_code: string;
  position?: string;
  base_salary: number;
  commission_rate: number;
  hire_date: string;
  is_active: boolean;
  skills: number[];
  created_at: string;
  updated_at: string;
}

// Schedule types
export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Schedule {
  id: number;
  employee_id: number;
  shift_id: number;
  work_date: string;
  status: 'scheduled' | 'completed' | 'absent';
  notes?: string;
  created_at: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  employee_code: string;
  employee_name: string;
}

// Appointment types
export interface Appointment {
  id: number;
  customer_id?: number;
  employee_id?: number;
  service_id: number;
  appointment_date: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_phone?: string;
  employee_code?: string;
  employee_name?: string;
  service_name: string;
  service_price: number;
  service_duration: number;
}

// Invoice types
export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number;
  employee_id?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  invoice_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_phone?: string;
  employee_name?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_id: number;
  employee_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_amount: number;
  created_at: string;
  service_name: string;
  service_description?: string;
  employee_name?: string;
}

export interface CreateInvoiceRequest {
  customer_id?: number;
  employee_id?: number;
  items: {
    service_id: number;
    employee_id?: number;
    quantity: number;
    unit_price?: number;
  }[];
  discount_amount?: number;
  tax_amount?: number;
  payment_method?: string;
  notes?: string;
}

// Payroll types
export interface Payroll {
  id: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  commission_total: number;
  bonus_amount: number;
  deduction_amount: number;
  gross_pay: number;
  net_pay: number;
  pay_status: 'pending' | 'paid';
  pay_date?: string;
  notes?: string;
  created_at: string;
  employee_code: string;
  employee_name: string;
}

// Dashboard types
export interface DashboardOverview {
  stats: {
    total_customers: string;
    total_employees: string;
    total_food_items: string;
    total_orders: string;
    paid_invoices: string;
    total_revenue: string;
  };
  recentInvoices: Array<{
    id: number;
    invoice_number: string;
    total_amount: string;
    payment_status: string;
    invoice_date: string;
    notes: string;
    customer_name: string | null;
    employee_name: string;
  }>;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  invoice_count: number;
}

export interface TopService {
  name: string;
  price: number;
  sold_count: number;
  total_revenue: number;
}

export interface EmployeePerformance {
  employee_name: string;
  employee_code: string;
  services_performed: number;
  total_revenue: number;
  total_commission: number;
  avg_service_value: number;
}

// Form types
export interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  commission_rate: number;
}

export interface CustomerFormData {
  fullname: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  gender: string;
  notes: string;
}

export interface EmployeeFormData {
  username: string;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  employee_code: string;
  position: string;
  base_salary: number;
  commission_rate: number;
  hire_date: string;
  skills: number[];
}

export interface AppointmentFormData {
  customer_id: number;
  employee_id?: number;
  service_id: number;
  appointment_date: string;
  notes: string;
}

// Filter types
export interface CustomerFilters {
  search: string;
  limit: number;
  offset: number;
}

export interface InvoiceFilters {
  customer_id?: number;
  employee_id?: number;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  date?: string; // For filtering by specific date
  limit: number;
  offset: number;
}

export interface AppointmentFilters {
  date?: string;
  employee_id?: number;
  customer_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit: number;
  offset: number;
}
