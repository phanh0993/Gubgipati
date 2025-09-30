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
    {
      if (USE_SUPABASE) {
        const limit = (params as any)?.limit ?? 100;
        const offset = (params as any)?.offset ?? 0;
        const search = (params as any)?.search || '';
        return new Promise((resolve, reject) => {
          let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false });

          if (search) {
            query = query.ilike('name', `%${search}%`);
          }

          query
            .range(offset, offset + limit - 1)
            .then((res: any) => {
              if (res.error) { reject(res.error); return; }
              const axiosLike = {
                data: {
                  customers: (res.data || []) as any,
                  total: res.count || 0,
                  limit,
                  offset,
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
              } as AxiosResponse<{ customers: Customer[]; total: number; limit: number; offset: number }>;
              resolve(axiosLike);
            }, reject);
        });
      }
      return api.get('/customers', { params });
    },
    
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
    {
      if (USE_SUPABASE) {
        return new Promise((resolve, reject) => {
          let query = supabase
            .from('employees')
            .select('*')
            .order('id', { ascending: true });
          if (params?.active !== undefined) query = (query as any).eq('is_active', params.active);
          if (params?.position) query = (query as any).ilike('position', `%${params.position}%`);
          query.then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: { employees: res.data || [] }, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<{ employees: Employee[] }>;
            resolve(axiosLike);
          }, reject);
        });
      }
      return api.get('/employees', { params });
    },
    
  getById: (id: number): Promise<AxiosResponse<{ employee: Employee; stats: any }>> =>
    api.get(`/employees/${id}`),
    
  create: (data: any): Promise<AxiosResponse<{ employee: Employee; message: string }>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('employees')
          .insert({
            username: data.username,
            fullname: data.fullname,
            email: data.email,
            phone: data.phone,
            employee_code: data.employee_code,
            position: data.position,
            base_salary: data.base_salary || 0,
            hire_date: data.hire_date || new Date().toISOString(),
            is_active: true
          })
          .select('*')
          .single()
          .then((res: any) => {
            if (res.error) { 
              reject(res.error); 
              return; 
            }
            const axiosLike = { 
              data: { employee: res.data, message: 'Employee created successfully' }, 
              status: 201, 
              statusText: 'Created', 
              headers: {}, 
              config: {} as any 
            } as AxiosResponse<{ employee: Employee; message: string }>;
            resolve(axiosLike);
          }, reject);
      });
    }
    return api.post('/employees', data);
  },
    
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
        let query = supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .order('invoice_date', { ascending: false });
        
        // Add date filtering if provided - SỬA: filter theo created_at thay vì invoice_date
        if (params.start_date) {
          query = query.gte('created_at', params.start_date);
        }
        if (params.end_date) {
          query = query.lte('created_at', params.end_date);
        }
        
        query
          .range(offset, offset + limit - 1)
          .then((res: any) => {
            if (res.error) {
              reject(res.error);
              return;
            }
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
          }, reject);
      });
    }
    return api.get('/invoices', { params });
  },
    
  getById: (id: number): Promise<AxiosResponse<{ invoice: Invoice; items: any[] }>> => {
    if (USE_SUPABASE) {
      return new Promise(async (resolve, reject) => {
        try {
          // Lấy invoice trước
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

          if (invoiceError) {
            reject(invoiceError);
            return;
          }

          // Lấy invoice_items với thông tin đầy đủ
          let itemsData: any[] = [];
          try {
            const itemsRes = await supabase
              .from('invoice_items')
              .select(`
                id, 
                service_id, 
                quantity, 
                unit_price, 
                total_price,
                employee_id
              `)
              .eq('invoice_id', id)
              .order('unit_price', { ascending: false }); // Sắp xếp theo giá giảm dần
              
            if (!itemsRes.error && Array.isArray(itemsRes.data)) {
              // Lấy tên món ăn và vé từ các bảng tương ứng
              const itemPromises = itemsRes.data.map(async (item: any) => {
                const foodItemId = item.service_id; // service_id chứa food_item_id hoặc buffet_package_id
                const isTicket = item.unit_price > 0 && [33, 34, 35].includes(foodItemId); // ID vé buffet
                
                // Lấy note từ order_items nếu có
                let note = '';
                let employeeName = '';
                
                try {
                  console.log('🔍 Looking for order_item with food_item_id:', foodItemId);
                  const { data: orderItem } = await supabase
                    .from('order_items')
                    .select('special_instructions')
                    .eq('food_item_id', foodItemId)
                    .maybeSingle();
                  
                  console.log('🔍 Found order_item:', orderItem);
                  note = orderItem?.special_instructions || '';
                } catch (e) {
                  console.warn('Could not fetch note for item:', foodItemId, e);
                }
                
                // Luôn sử dụng invoice employee_id cho tất cả items
                if (invoiceData.employee_id) {
                  try {
                    const { data: employee } = await supabase
                      .from('employees')
                      .select('fullname')
                      .eq('id', invoiceData.employee_id)
                      .single();
                    employeeName = employee?.fullname || '';
                    console.log('🔍 Employee from invoice:', { employee_id: invoiceData.employee_id, employee_name: employeeName });
                  } catch (e) {
                    console.warn('Could not fetch employee from invoice:', invoiceData.employee_id);
                  }
                }
                
                console.log('🔍 Final employee name for item:', { foodItemId, employeeName, isTicket });
                
                if (isTicket) {
                  // Lấy tên vé từ buffet_packages
                  const { data: buffetPackage } = await supabase
                    .from('buffet_packages')
                    .select('name')
                    .eq('id', foodItemId)
                    .single();
                  
                  return {
                    ...item,
                    service_name: buffetPackage?.name || `VÉ ${item.unit_price.toLocaleString()}K`,
                    service_type: 'buffet_ticket',
                    food_item_id: foodItemId,
                    special_instructions: note,
                    employee_name: employeeName || 'Chưa xác định'
                  };
                } else {
                  // Lấy tên món ăn từ food_items
                  const { data: foodItem } = await supabase
                    .from('food_items')
                    .select('name')
                    .eq('id', foodItemId)
                    .single();
                  
                  return {
                    ...item,
                    service_name: foodItem?.name || `Food Item ${foodItemId}`,
                    service_type: 'food_item',
                    food_item_id: foodItemId,
                    special_instructions: note,
                    employee_name: employeeName || 'Chưa xác định'
                  };
                }
              });
              
              itemsData = await Promise.all(itemPromises);
            }
          } catch (e) {
            console.warn('invoice_items by invoice_id not available:', e);
          }

          // Lấy thông tin nhân viên từ employee_id
          let employeeName = '';
          if (invoiceData.employee_id) {
            try {
              const empRes = await supabase
                .from('employees')
                .select('*')
                .eq('id', invoiceData.employee_id)
                .single();
              if (empRes.data) {
                employeeName = empRes.data.fullname || empRes.data.full_name || empRes.data.name || '';
              }
            } catch (e) {
              console.warn('Could not fetch employee name:', e);
            }
          }

          // Nếu chưa có items từ invoice_items → fallback qua orders/order_items
          if ((!itemsData || itemsData.length === 0)) {
            // Ưu tiên khớp theo order_number = invoice_number
            let fallbackOrderId: number | undefined = undefined;
            try {
              if (invoiceData?.invoice_number) {
                const orderRes = await supabase
                  .from('orders')
                  .select('id, employee_id')
                  .eq('order_number', invoiceData.invoice_number)
                  .maybeSingle();
                if (orderRes.data?.id) {
                  fallbackOrderId = orderRes.data.id;
                  if (!invoiceData.employee_id && orderRes.data.employee_id) {
                    invoiceData.employee_id = orderRes.data.employee_id;
                  }
                }
              }
            } catch (e) {
              console.warn('Lookup order by order_number failed:', e);
            }

            // Nếu chưa có, thử parse trong notes: "Order: 55" hoặc "Buffet Order: 55"
            if (!fallbackOrderId) {
              const notes: string = invoiceData?.notes || '';
              const match = notes.match(/order\s*[:#-]?\s*(\d+)/i);
              const parsedOrderId = match ? Number(match[1]) : undefined;
              if (parsedOrderId && !Number.isNaN(parsedOrderId)) {
                fallbackOrderId = parsedOrderId;
              }
            }

            if (fallbackOrderId) {
              try {
                // Lấy order để suy ra employee nếu chưa có
                if (!employeeName) {
                  const orderEmp = await supabase
                    .from('orders')
                    .select('employee_id')
                    .eq('id', fallbackOrderId)
                    .single();
                  const eid = orderEmp.data?.employee_id;
                  if (eid) {
                    const empRes = await supabase
                      .from('employees')
                      .select('*')
                      .eq('id', eid)
                      .single();
                    employeeName = empRes.data?.fullname || empRes.data?.full_name || empRes.data?.name || employeeName;
                  }
                }

                // Lấy order_items theo order_id và join tên món
                const { data: orderItems } = await supabase
                  .from('order_items')
                  .select('id, food_item_id, quantity, unit_price, total_price, special_instructions, food_items(name, price)')
                  .eq('order_id', fallbackOrderId);

                if (Array.isArray(orderItems)) {
                  itemsData = orderItems.map((it: any) => ({
                    id: it.id,
                    service_id: it.food_item_id,
                    quantity: Number(it.quantity || 0),
                    unit_price: Number(it.unit_price || 0),
                    total_price: Number(it.total_price || 0),
                    service_name: it.food_items?.name || `Service ${it.food_item_id}`,
                    special_instructions: it.special_instructions || ''
                  }));
                }
              } catch (e) {
                console.warn('Fallback via orders/order_items failed:', e);
              }
            }
          }

          // Chuẩn hóa invoice items (khi có itemsData)
          const normalizedItems = (itemsData || []).map((item: any) => ({
            ...item,
            service_name: item.service_name || `Service ${item.service_id}`,
            employee_name: employeeName,
            special_instructions: item.special_instructions || ''
          }));

          const invoiceWithEmployee = {
            ...invoiceData,
            employee_name: employeeName
          };

          const axiosLike = {
            data: { invoice: invoiceWithEmployee as any, items: normalizedItems as any[] },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse<{ invoice: Invoice; items: any[] }>;
          resolve(axiosLike);

        } catch (error) {
          reject(error);
        }
      });
    }
    return api.get(`/invoices/${id}`);
  },
    
  create: (data: CreateInvoiceRequest): Promise<AxiosResponse<{ invoice: Invoice; items: any[]; message: string }>> => {
    if (USE_SUPABASE) {
      return new Promise(async (resolve, reject) => {
        try {
          console.log('🔍 [INVOICE CREATE] Starting invoice creation with data:', {
            items: data.items,
            order_id: (data as any).order_id,
            order_number: (data as any).order_number,
            employee_id: (data as any).employee_id,
            notes: (data as any).notes
          });

          const items = Array.isArray(data.items) ? data.items : [];
          const subtotal = items.reduce((sum: number, it: any) => sum + Number(it.unit_price || it.price || 0) * Number(it.quantity || 0), 0);
          const discount = Number((data as any).discount_amount || 0);
          const tax = 0; // per requirement: remove tax calculation
          const total = subtotal - discount + tax;

          const payload: any = {
            invoice_number: (data as any).invoice_number || `INV-${Date.now()}`,
            customer_id: (data as any).customer_id ?? null,
            employee_id: (data as any).employee_id ?? null,
            subtotal: subtotal,
            discount_amount: discount,
            tax_amount: tax,
            total_amount: total,
            payment_method: (data as any).payment_method || 'cash',
            payment_status: (data as any).payment_status || 'paid',
            invoice_date: new Date().toISOString(),
            notes: (data as any).notes || null,
          };

          console.log('📝 [INVOICE CREATE] Invoice payload:', payload);

          // 1) Tạo invoice
          const { data: inv, error: invErr } = await supabase
            .from('invoices')
            .insert(payload)
            .select('*')
            .single();
          if (invErr) { 
            console.error('❌ [INVOICE CREATE] Invoice creation failed:', invErr);
            reject(invErr); 
            return; 
          }

          console.log('✅ [INVOICE CREATE] Invoice created with ID:', inv.id);

          // 2) Tạo invoice_items nếu có items
          let createdItems: any[] = [];
          if (items.length > 0) {
            console.log('📦 [INVOICE CREATE] Creating invoice_items from provided items:', items.length);
            const insertItems = items.map((it: any) => ({
              invoice_id: inv.id,
              service_id: it.food_item_id || it.service_id || it.id, // Lưu food_item_id vào service_id
              employee_id: payload.employee_id,
              quantity: Number(it.quantity || 0),
              unit_price: Number(it.unit_price || it.price || 0)
              // total_price is generated column, don't include it
            }));

            const { data: inserted, error: itemsErr } = await supabase
              .from('invoice_items')
              .insert(insertItems)
              .select('*');
            if (itemsErr) { 
              console.error('❌ [INVOICE CREATE] invoice_items insert error:', itemsErr); 
            } else {
              console.log('✅ [INVOICE CREATE] invoice_items created:', inserted?.length || 0);
            }
            createdItems = inserted || [];
          } else {
            console.log('⚠️ [INVOICE CREATE] No items provided, will try fallback strategies');
          }

               // Fallback: luôn kiểm tra và copy từ order_items để đảm bảo đầy đủ
               // Nếu chỉ có 1 item hoặc items không đúng, cần copy từ order_items
               const needsFallback = !createdItems.length || 
                 (createdItems.length === 1 && createdItems[0]?.service_id === 1) ||
                 (createdItems.length < 2); // Ít hơn 2 items có thể thiếu món ăn
               
               if (needsFallback) {
            console.log('🔄 [INVOICE CREATE] Starting fallback strategies to find order_items...');
            
            // Xóa invoice_items cũ nếu có để tạo lại từ order_items
            if (createdItems.length > 0) {
              console.log('🗑️ [INVOICE CREATE] Deleting existing invoice_items to recreate from order_items...');
              const { error: deleteError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoice_id', inv.id);
              if (deleteError) {
                console.error('❌ [INVOICE CREATE] Error deleting existing invoice_items:', deleteError);
              } else {
                console.log('✅ [INVOICE CREATE] Deleted existing invoice_items');
                createdItems = []; // Reset để tạo lại
              }
            }
            
            try {
              let fallbackOrderId: number | undefined = (data as any).order_id;
              console.log('🔍 [INVOICE CREATE] Strategy 1 - Direct order_id:', fallbackOrderId);
              
              // Ưu tiên match theo order_number nếu được truyền
              const maybeOrderNumber = (data as any).order_number;
              if (!fallbackOrderId && maybeOrderNumber) {
                console.log('🔍 [INVOICE CREATE] Strategy 2 - Looking up by order_number:', maybeOrderNumber);
                const byNumber = await supabase
                  .from('orders')
                  .select('id')
                  .eq('order_number', maybeOrderNumber)
                  .maybeSingle();
                if (byNumber.data?.id) {
                  fallbackOrderId = byNumber.data.id;
                  console.log('✅ [INVOICE CREATE] Found order by order_number:', fallbackOrderId);
                }
              }
              
              // Parse notes dạng "Order: 55"/"Buffet Order: 55" hoặc "BUF-xxx"
              if (!fallbackOrderId && payload.notes) {
                console.log('🔍 [INVOICE CREATE] Strategy 3 - Parsing notes:', payload.notes);
                // Thử parse order_id trực tiếp
                let match = String(payload.notes).match(/order\s*[:#-]?\s*(\d+)/i);
                if (match) {
                  fallbackOrderId = Number(match[1]);
                  console.log('✅ [INVOICE CREATE] Found order_id from notes:', fallbackOrderId);
                } else {
                  // Thử parse order_number từ notes (BUF-xxx)
                  match = String(payload.notes).match(/BUF-(\d+)/i);
                  if (match) {
                    const orderNumber = `BUF-${match[1]}`;
                    console.log('🔍 [INVOICE CREATE] Found order_number in notes:', orderNumber);
                    const byNumber = await supabase
                      .from('orders')
                      .select('id')
                      .eq('order_number', orderNumber)
                      .maybeSingle();
                    if (byNumber.data?.id) {
                      fallbackOrderId = byNumber.data.id;
                      console.log('✅ [INVOICE CREATE] Found order_id from order_number:', fallbackOrderId);
                    }
                  }
                }
              }
              
              // Strategy 4: Tìm order theo invoice_number nếu nó là order_number
              if (!fallbackOrderId && payload.invoice_number) {
                console.log('🔍 [INVOICE CREATE] Strategy 4 - Looking up by invoice_number:', payload.invoice_number);
                const byInvoiceNumber = await supabase
                  .from('orders')
                  .select('id')
                  .eq('order_number', payload.invoice_number)
                  .maybeSingle();
                if (byInvoiceNumber.data?.id) {
                  fallbackOrderId = byInvoiceNumber.data.id;
                  console.log('✅ [INVOICE CREATE] Found order_id from invoice_number:', fallbackOrderId);
                }
              }
              
              // Strategy 5: Tìm order theo notes nếu có "Buffet Order: BUF-xxx"
              if (!fallbackOrderId && payload.notes) {
                console.log('🔍 [INVOICE CREATE] Strategy 5 - Looking up by notes:', payload.notes);
                const match = String(payload.notes).match(/Buffet Order:\s*BUF-(\d+)/i);
                if (match) {
                  const orderNumber = `BUF-${match[1]}`;
                  console.log('🔍 [INVOICE CREATE] Found order_number in notes:', orderNumber);
                  const byNotes = await supabase
                    .from('orders')
                    .select('id')
                    .eq('order_number', orderNumber)
                    .maybeSingle();
                  if (byNotes.data?.id) {
                    fallbackOrderId = byNotes.data.id;
                    console.log('✅ [INVOICE CREATE] Found order_id from notes:', fallbackOrderId);
                  }
                }
              }

              if (fallbackOrderId) {
                console.log('📋 [INVOICE CREATE] Fetching order and order_items for order_id:', fallbackOrderId);
                
                // Lấy thông tin order để có buffet_package_id
                const { data: orderInfo, error: orderErr } = await supabase
                  .from('orders')
                  .select('buffet_package_id, buffet_quantity')
                  .eq('id', fallbackOrderId)
                  .single();
                
                // Lấy order_items
                const { data: orderItems, error: oiErr } = await supabase
                  .from('order_items')
                  .select('food_item_id, quantity, unit_price, total_price')
                  .eq('order_id', fallbackOrderId);
                
                if (oiErr) {
                  console.error('❌ [INVOICE CREATE] Error fetching order_items:', oiErr);
                } else {
                  let itemsToInsert: any[] = [];
                  
                  // 1. Thêm vé buffet nếu có (lưu như món ăn đặc biệt với service_id = null)
                  if (orderInfo?.buffet_package_id) {
                    console.log('🎫 [INVOICE CREATE] Adding buffet package:', orderInfo.buffet_package_id);
                    const { data: buffetPackage, error: buffetErr } = await supabase
                      .from('buffet_packages')
                      .select('id, name, price')
                      .eq('id', orderInfo.buffet_package_id)
                      .single();
                    
                    if (!buffetErr && buffetPackage) {
                      itemsToInsert.push({
                        invoice_id: inv.id,
                        service_id: buffetPackage.id, // Lưu buffet_package_id vào service_id
                        employee_id: payload.employee_id,
                        quantity: Number(orderInfo.buffet_quantity || 1),
                        unit_price: Number(buffetPackage.price || 0)
                      });
                      console.log('✅ [INVOICE CREATE] Added buffet ticket:', buffetPackage.name, buffetPackage.price);
                    }
                  }
                  
                  // 2. Thêm các món ăn từ order_items
                  if (Array.isArray(orderItems) && orderItems.length) {
                    console.log('🍽️ [INVOICE CREATE] Adding food items:', orderItems.length);
                    const foodItems = orderItems.map((it: any) => ({
                      invoice_id: inv.id,
                      service_id: it.food_item_id, // Lưu food_item_id vào service_id
                      employee_id: payload.employee_id,
                      quantity: Number(it.quantity || 0),
                      unit_price: Number(it.unit_price || 0)
                    }));
                    itemsToInsert.push(...foodItems);
                  }
                  
                  // 3. Insert tất cả items
                  if (itemsToInsert.length > 0) {
                    console.log('💾 [INVOICE CREATE] Inserting invoice_items:', itemsToInsert.length, 'items');
                    const { data: inserted2, error: ins2Err } = await supabase
                      .from('invoice_items')
                      .insert(itemsToInsert)
                      .select('*');
                    
                    if (!ins2Err) {
                      createdItems = inserted2 || [];
                      console.log('✅ [INVOICE CREATE] Successfully created invoice_items:', createdItems.length);
                    // Optional: trigger kitchen printing by group mappings
                    try {
                      const host = (typeof window !== 'undefined' && (window as any).location) ? (window as any).location.hostname : 'localhost';
                      const agentBase = `http://${host}:9977`;
                      // Fetch mappings
                      const { data: mappings } = await supabase
                        .from('printer_mappings')
                        .select('group_key, printer_uri');
                      const groupToPrinter: Record<string, string> = {};
                      (mappings || []).forEach((m: any) => { groupToPrinter[m.group_key] = m.printer_uri; });
                      
                      // Lấy thông tin chi tiết món ăn để in
                      const { data: foodItems } = await supabase
                        .from('food_items')
                        .select('id, name')
                        .in('id', createdItems.map((it: any) => it.service_id));
                      
                      const foodMap: Record<number, string> = {};
                      (foodItems || []).forEach((item: any) => {
                        foodMap[item.id] = item.name;
                      });
                      
                      // Lấy thông tin order_items để có note
                      const { data: orderItemsWithNotes } = await supabase
                        .from('order_items')
                        .select('food_item_id, special_instructions')
                        .eq('order_id', fallbackOrderId);
                      
                      const noteMap: Record<number, string> = {};
                      (orderItemsWithNotes || []).forEach((item: any) => {
                        if (item.special_instructions && item.special_instructions !== 'Gọi thoải mái') {
                          noteMap[item.food_item_id] = item.special_instructions;
                        }
                      });
                      
                      const text = createdItems.map((it: any) => {
                        const foodName = foodMap[it.service_id] || `ITEM ${it.service_id}`;
                        const note = noteMap[it.service_id] ? ` - ${noteMap[it.service_id]}` : '';
                        return `x${it.quantity} - ${foodName}${note}`;
                      }).join('\n');
                      
                      // Choose a demo group: kitchen_other
                      const uri = groupToPrinter['kitchen_other'];
                      if (uri) {
                        await fetch(`${agentBase}/print`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ printerUri: uri, title: `Order ${fallbackOrderId}`, rawText: text })
                        });
                      }
                    } catch (e) {
                      console.warn('🖨️ print skip:', e);
                    }
                    } else {
                      console.error('❌ [INVOICE CREATE] invoice_items insert error:', ins2Err);
                    }
                  } else {
                    console.log('⚠️ [INVOICE CREATE] No items to insert for order_id:', fallbackOrderId);
                  }
                }
              }

              // Thử chiến lược 4: tìm order mới nhất của nhân viên trong 15 phút gần đây
              if (!createdItems.length && payload.employee_id) {
                console.log('🔍 [INVOICE CREATE] Strategy 4 - Looking for recent orders by employee_id:', payload.employee_id);
                const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
                const { data: recentOrders, error: roErr } = await supabase
                  .from('orders')
                  .select('id, created_at, status, employee_id')
                  .eq('employee_id', payload.employee_id)
                  .in('status', ['paid', 'served', 'completed', 'open'])
                  .gte('created_at', fifteenMinAgo)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (roErr) {
                  console.error('❌ [INVOICE CREATE] Error fetching recent orders:', roErr);
                } else if (Array.isArray(recentOrders) && recentOrders[0]?.id) {
                  const roId = recentOrders[0].id;
                  console.log('✅ [INVOICE CREATE] Found recent order:', roId);
                  
                  const { data: orderItems2 } = await supabase
                    .from('order_items')
                    .select('food_item_id, quantity, unit_price, total_price')
                    .eq('order_id', roId);
                  
                  if (Array.isArray(orderItems2) && orderItems2.length) {
                    console.log('✅ [INVOICE CREATE] Found order_items from recent order:', orderItems2.length);
                    const fromOrder2 = orderItems2.map((it: any) => ({
                      invoice_id: inv.id,
                      service_id: it.food_item_id, // Lưu food_item_id vào service_id
                      employee_id: payload.employee_id,
                      quantity: Number(it.quantity || 0),
                      unit_price: Number(it.unit_price || 0)
                      // total_price is generated column, don't include it
                    }));
                    
                    const { data: inserted3, error: ins3Err } = await supabase
                      .from('invoice_items')
                      .insert(fromOrder2)
                      .select('*');
                    
                    if (!ins3Err) {
                      createdItems = inserted3 || [];
                      console.log('✅ [INVOICE CREATE] Successfully created invoice_items from recent order:', createdItems.length);
                    } else {
                      console.error('❌ [INVOICE CREATE] invoice_items recent order insert error:', ins3Err);
                    }
                  } else {
                    console.log('⚠️ [INVOICE CREATE] No order_items found in recent order:', roId);
                  }
                } else {
                  console.log('⚠️ [INVOICE CREATE] No recent orders found for employee_id:', payload.employee_id);
                }
              }
            } catch (fallbackErr) {
              console.error('❌ [INVOICE CREATE] invoice_items fallback failed:', fallbackErr);
            }
          } else {
            console.log('✅ [INVOICE CREATE] invoice_items already created, skipping fallback');
          }

          // 3) Xác nhận
          const axiosLike = {
            data: { invoice: inv as any, items: createdItems, message: 'Invoice created' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse<{ invoice: Invoice; items: any[]; message: string }>;
          resolve(axiosLike);
        } catch (e) {
          reject(e);
        }
      });
    }
    return api.post('/invoices', data);
  },
    
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
    if (USE_SUPABASE) {
      // Tính doanh thu tháng theo invoices đã thanh toán
      const now = date ? new Date(date) : new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startISO = startOfMonth.toISOString();
      const endISO = now.toISOString();

      return new Promise(async (resolve, reject) => {
        try {
          const [customersCnt, employeesCnt, foodCnt, ordersCnt, invoicesAgg] = await Promise.all([
            supabase.from('customers').select('*', { count: 'exact', head: true }),
            supabase.from('employees').select('*', { count: 'exact', head: true }),
            supabase.from('food_items').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase
              .from('invoices')
              .select('total_amount')
              .eq('payment_status', 'paid')
              .gte('invoice_date', startISO)
              .lte('invoice_date', endISO)
          ]);

          const monthlyRevenue = (invoicesAgg.data || []).reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

          const data: DashboardOverview = {
            stats: {
              total_customers: String(customersCnt.count || 0),
              total_employees: String(employeesCnt.count || 0),
              total_food_items: String(foodCnt.count || 0),
              total_orders: String(ordersCnt.count || 0),
              paid_invoices: String((invoicesAgg.data || []).length),
              total_revenue: String(monthlyRevenue)
            },
            recentInvoices: []
          };
          const axiosLike = { data, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<DashboardOverview>;
          resolve(axiosLike);
        } catch (e) {
          reject(e);
        }
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getDashboard();
    }
    return api.get('/dashboard', { params: { date } });
  },

  // Get revenue by date range
  getRevenueByDateRange: (startDate: string, endDate: string): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise(async (resolve, reject) => {
        try {
          const invoicesRes = await supabase
            .from('invoices')
            .select('*')
            .eq('payment_status', 'paid')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: true });

          if (invoicesRes.error) {
            reject(invoicesRes.error);
            return;
          }

          const invoices = invoicesRes.data || [];
          const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

          const data = {
            invoices,
            totalRevenue,
            count: invoices.length
          };

          const axiosLike = { data, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
          resolve(axiosLike);
        } catch (e) {
          reject(e);
        }
      });
    }
    return api.get('/dashboard/revenue', { params: { start_date: startDate, end_date: endDate } });
  },

  // Get top foods by date range
  getTopFoods: (startDate: string, endDate: string): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise(async (resolve, reject) => {
        try {
          // Get invoices in date range - SỬA: đọc từ invoices thay vì orders
          const invoicesRes = await supabase
            .from('invoices')
            .select(`
              *,
              invoice_items (
                service_id,
                quantity,
                unit_price,
                total_price
              )
            `)
            .eq('payment_status', 'paid')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

          if (invoicesRes.error) {
            reject(invoicesRes.error);
            return;
          }

          const invoices = invoicesRes.data || [];
          const foodCounts: { [key: string]: { quantity: number; revenue: number } } = {};

          // Count food items from invoices
          invoices.forEach((invoice: any) => {
            if (invoice.invoice_items && Array.isArray(invoice.invoice_items)) {
              invoice.invoice_items.forEach((item: any) => {
                const foodName = `Service ${item.service_id}` || 'Unknown Food';
                if (!foodCounts[foodName]) {
                  foodCounts[foodName] = { quantity: 0, revenue: 0 };
                }
                foodCounts[foodName].quantity += Number(item.quantity || 0);
                foodCounts[foodName].revenue += Number(item.total_price || 0);
              });
            }
          });

          // Convert to array and sort
          const topFoods = Object.entries(foodCounts)
            .map(([name, data]) => ({
              name,
              quantity: data.quantity,
              revenue: data.revenue
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

          const axiosLike = { data: topFoods, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
          resolve(axiosLike);
        } catch (e) {
          reject(e);
        }
      });
    }
    return api.get('/dashboard/top-foods', { params: { start_date: startDate, end_date: endDate } });
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
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('employees')
          .select('*')
          .order('id', { ascending: true })
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<Employee[]>;
            resolve(axiosLike);
          }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getEmployees();
    }
    return api.get('/employees');
  },

  create: (data: Partial<Employee>): Promise<AxiosResponse<{ employee: Employee; message: string }>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('employees')
          .insert({
            username: data.username,
            fullname: data.fullname,
            email: data.email,
            phone: data.phone,
            employee_code: data.employee_code,
            position: data.position,
            base_salary: data.base_salary || 0,
            hire_date: data.hire_date || new Date().toISOString(),
            is_active: true
          })
          .select('*')
          .single()
          .then((res: any) => {
            if (res.error) { 
              reject(res.error); 
              return; 
            }
            const axiosLike = { 
              data: { employee: res.data, message: 'Employee created successfully' }, 
              status: 201, 
              statusText: 'Created', 
              headers: {}, 
              config: {} as any 
            } as AxiosResponse<{ employee: Employee; message: string }>;
            resolve(axiosLike);
          }, reject);
      });
    }
    return api.post('/employees', data);
  },

  update: (id: number, data: Partial<Employee>): Promise<AxiosResponse<{ employee: Employee; message: string }>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        const updateData: any = {
          fullname: data.fullname,
          email: data.email,
          phone: data.phone,
          employee_code: data.employee_code,
          position: data.position,
          base_salary: data.base_salary
        };
        
        
        supabase
          .from('employees')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single()
          .then((res: any) => {
            if (res.error) { 
              reject(res.error); 
              return; 
            }
            const axiosLike = { 
              data: { employee: res.data, message: 'Employee updated successfully' }, 
              status: 200, 
              statusText: 'OK', 
              headers: {}, 
              config: {} as any 
            } as AxiosResponse<{ employee: Employee; message: string }>;
            resolve(axiosLike);
          }, reject);
      });
    }
    return api.put(`/employees/${id}`, data);
  },

  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('employees')
          .update({ is_active: false })
          .eq('id', id)
          .then((res: any) => {
            if (res.error) { 
              reject(res.error); 
              return; 
            }
            const axiosLike = { 
              data: { message: 'Employee deactivated successfully' }, 
              status: 200, 
              statusText: 'OK', 
              headers: {}, 
              config: {} as any 
            } as AxiosResponse<{ message: string }>;
            resolve(axiosLike);
          }, reject);
      });
    }
    return api.delete(`/employees/${id}`);
  },

  // Mobile login authentication using Supabase
  mobileLogin: (credentials: { username: string; password: string }): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('employees')
          .select('*')
          .eq('username', credentials.username)
          .eq('is_active', true)
          .single()
          .then((res: any) => {
            if (res.error) {
              console.log('Employee not found or inactive:', credentials.username);
              reject(new Error('Invalid credentials'));
              return;
            }

            const employee = res.data;
            console.log('Found employee:', employee);

            // For mobile login, allow empty password or any password
            // For desktop login, would require password verification
            const isMobileLogin = credentials.password === '' || credentials.password === undefined;
            
            if (!isMobileLogin && employee.password && employee.password !== credentials.password) {
              console.log('Password mismatch');
              reject(new Error('Invalid credentials'));
              return;
            }

            // Remove password from response
            const { password, ...employeeWithoutPassword } = employee;
            
            // Determine role based on position
            let role = 'staff';
            if (employee.position && (
              employee.position.toLowerCase().includes('manager') || 
              employee.position.toLowerCase().includes('quản lý') ||
              employee.position.toLowerCase().includes('admin')
            )) {
              role = 'manager';
            }
            
            const response = {
              data: {
                user: {
                  id: employee.id,
                  username: employee.username,
                  full_name: employee.fullname || employee.full_name,
                  email: employee.email,
                  phone: employee.phone,
                  role: role,
                  is_active: employee.is_active,
                  employee_code: employee.employee_code,
                  position: employee.position,
                  created_at: employee.created_at,
                  updated_at: employee.updated_at
                },
                token: `mobile-token-${employee.id}-${Date.now()}`,
                message: 'Mobile login successful'
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as any
            } as AxiosResponse<any>;

            console.log('Mobile login successful for:', employee.username);
            resolve(response);
          }, (error) => {
            console.error('Mobile login error:', error);
            reject(new Error('Invalid credentials'));
          });
      });
    }
    
    // Fallback to mock API if not using Supabase
    return mockAPI.login(credentials);
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
      return new Promise((resolve, reject) => {
        supabase
          .from('buffet_packages')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: true })
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any[]>;
            resolve(axiosLike);
          }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getBuffetPackages();
    }
    return api.get('/buffet-packages');
  },
  
  getPackageItems: (packageId: number): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('buffet_package_items')
          .select('*, food_item:food_items(*)')
          .eq('package_id', packageId)
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any[]>;
            resolve(axiosLike);
          }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getBuffetPackageItems(packageId);
    }
    return api.get(`/buffet-package-items?package_id=${packageId}`);
  },
  
  getFoodItems: (): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('food_items')
          .select('*')
          .eq('is_available', true)
          .order('id', { ascending: true })
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any[]>;
            resolve(axiosLike);
          }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getFoodItems();
    }
    return api.get('/food-items');
  },

  getBuffetPackageById: (id: number): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('buffet_packages')
          .select('*')
          .eq('id', id)
          .single()
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || {}, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
            resolve(axiosLike);
          }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getBuffetPackageById(id);
    }
    return api.get(`/buffet-packages/${id}`);
  },
};

// Table API
export const tableAPI = {
  getTables: (): Promise<AxiosResponse<any[]>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('tables')
          .select('*')
          .order('id', { ascending: true })
          .then((res: any) => {
            if (res.error) { reject(res.error); return; }
            const axiosLike = { data: res.data || [], status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any[]>;
            resolve(axiosLike);
          }, reject);
      });
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
      const tableId = params?.table_id;
      return new Promise((resolve, reject) => {
        let query = supabase.from('orders').select(`
          *,
          items:order_items(*),
          employee:employees(fullname)
        `).order('id', { ascending: false });
        if (tableId) query = (query as any).eq('table_id', tableId);
        query.then((res: any) => {
          if (res.error) { reject(res.error); return; }
          // Chuẩn hóa để tương thích UI hiện tại: set order_type='buffet' nếu có buffet_package_id, status 'pending' nếu 'open'
          const list = (res.data || []).map((o: any) => ({
            ...o,
            order_type: o.order_type || (o.buffet_package_id ? 'buffet' : 'other'),
            status: o.status === 'open' ? 'pending' : o.status,
            // Map employee data from join
            employee_name: o.employee?.fullname || 'Chưa xác định',
            // Table info will be fetched separately
            table_name: `Bàn ${o.table_id}`,
            area: 'Unknown'
          }));
          const axiosLike = { data: list, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any[]>;
          resolve(axiosLike);
        }, reject);
      });
    }
    if (IS_PRODUCTION) {
      return mockAPI.getOrders();
    }
    return api.get('/orders', { params });
  },
  getOrderById: (id: number): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              food_item_id,
              quantity,
              unit_price,
              total_price,
              food_items (
                name
              )
            )
          `)
          .eq('id', id)
          .single()
          .then(async (res: any) => {
            if (res.error) { reject(res.error); return; }
            const o = res.data || {};
            try {
              const [tableRes, pkgRes, empRes] = await Promise.all([
                o.table_id ? supabase.from('tables').select('table_name, area, table_number').eq('id', o.table_id).single() : Promise.resolve({ data: null }),
                o.buffet_package_id ? supabase.from('buffet_packages').select('name, price').eq('id', o.buffet_package_id).single() : Promise.resolve({ data: null }),
                o.employee_id ? supabase.from('employees').select('fullname').eq('id', o.employee_id).single() : Promise.resolve({ data: null })
              ]);

              console.log('🔍 Join results:', {
                table: tableRes.data,
                package: pkgRes.data,
                employee: empRes.data
              });

              // Đọc items từ order_items và join với food_items để lấy tên
              console.log('🔍 Order data:', o);
              console.log('🔍 Order items from DB:', o.order_items);
              const normalizedItems = (o.order_items || []).map((it: any, index: number) => {
                const foodItemId = it.food_item_id;
                // Vé buffet: xác định linh hoạt thay vì hardcode ID
                const looksLikeTicketByNote = String(it.special_instructions || '').toLowerCase().includes('vé buffet');
                const looksLikeTicketByPkg = !!o.buffet_package_id && Number(o.buffet_package_id) === Number(foodItemId);
                const looksLikeTicketByMissingName = !it.food_items?.name && Number(it.unit_price || 0) > 0 && !!o.buffet_package_id;
                const isTicket = looksLikeTicketByNote || looksLikeTicketByPkg || looksLikeTicketByMissingName;

                // Tên item: nếu là vé, ưu tiên tên gói buffet; fallback VÉ <giá>K
                let itemName = 'Unknown Item';
                if (isTicket) {
                  const ticketPrice = Number(it.unit_price || 0);
                  itemName = (pkgRes.data?.name) || (o.buffet_package_name) || (ticketPrice > 0 ? `VÉ ${Math.round(ticketPrice / 1000)}K` : 'Vé buffet');
                } else {
                  itemName = it.food_items?.name || 'Unknown Item';
                }

                return {
                  id: it.id || index,
                  order_id: o.id,
                  food_item_id: it.food_item_id,
                  name: itemName,
                  quantity: Number(it.quantity || 0),
                  price: Number(it.unit_price || 0),
                  total: Number(it.total_price || 0),
                  is_ticket: isTicket,
                  special_instructions: it.special_instructions || ''
                };
              });
              console.log('🔍 Normalized items:', normalizedItems);

              const normalized = {
                ...o,
                order_type: o.order_type || (o.buffet_package_id ? 'buffet' : 'other'),
                status: o.status === 'open' ? 'pending' : o.status,
                table_name: tableRes.data?.table_name || '',
                area: tableRes.data?.area || '',
                table_number: tableRes.data?.table_number || '',
                buffet_package_name: pkgRes.data?.name || 'Buffet Package',
                buffet_package_price: Number(pkgRes.data?.price || 0),
                employee_name: empRes.data?.fullname || 'Chưa xác định',
                items: normalizedItems
              };

              const axiosLike = { data: normalized, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
              resolve(axiosLike);
            } catch (e) {
              reject(e);
            }
          }, reject);
      });
    }
    return api.get(`/orders/${id}`);
  },
  createOrder: (data: any): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise(async (resolve, reject) => {
        try {
          const { items, ...order } = data;
          console.log('🚀 Creating order with data:', { items: items?.length, order });
          
          // Tạo order_number nếu bảng yêu cầu NOT NULL
          const orderNumber = order.order_number || `BUF-${Date.now()}`;
          const orderPayload = { 
            order_number: orderNumber, 
            status: 'open', 
            ...order 
          };
          
          console.log('📝 Order payload:', orderPayload);
          
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select('*')
            .single();

          if (orderError) {
            console.error('❌ Error creating order:', orderError);
            reject(orderError);
            return;
          }

          console.log('✅ Order created:', orderData);
          const orderId = orderData.id;

          // 1. Lưu vé buffet vào order_items trước (nếu có)
          if (orderPayload.buffet_package_id && orderPayload.buffet_quantity > 0) {
            console.log('🎫 Processing buffet ticket for order_items:', {
              buffet_package_id: orderPayload.buffet_package_id,
              buffet_quantity: orderPayload.buffet_quantity
            });
            
            // Lấy thông tin vé buffet
            const { data: buffetPackage } = await supabase
              .from('buffet_packages')
              .select('id, name, price')
              .eq('id', orderPayload.buffet_package_id)
              .single();
            
            if (buffetPackage) {
              const ticketFoodItemId = orderPayload.buffet_package_id; // ID vé = buffet_package_id
              const ticketQuantity = Number(orderPayload.buffet_quantity || 1);
              const ticketPrice = Number(buffetPackage.price || 0);
              const ticketTotal = ticketPrice * ticketQuantity;
              
              console.log(`🎫 Adding buffet ticket: ${buffetPackage.name} x${ticketQuantity} = ${ticketTotal}₫`);
              
              // Kiểm tra xem vé đã tồn tại chưa
              const { data: existingTicket } = await supabase
                .from('order_items')
                .select('id, quantity, unit_price, total_price')
                .eq('order_id', orderId)
                .eq('food_item_id', ticketFoodItemId)
                .maybeSingle();

              if (existingTicket) {
                // Vé đã tồn tại - cộng dồn số lượng
                const oldQuantity = Number(existingTicket.quantity || 0);
                const newQuantity = oldQuantity + ticketQuantity;
                const newTotalPrice = ticketPrice * newQuantity;
                
                console.log(`🔄 Updating existing ticket ${ticketFoodItemId}: ${oldQuantity} + ${ticketQuantity} = ${newQuantity}`);
                
                const { error: updateError } = await supabase
                  .from('order_items')
                  .update({ 
                    quantity: newQuantity, 
                    total_price: newTotalPrice 
                  })
                  .eq('id', existingTicket.id);
                
                if (updateError) {
                  console.error(`❌ Failed to update ticket ${ticketFoodItemId}:`, updateError);
                } else {
                  console.log(`✅ Updated existing ticket ${ticketFoodItemId}: ${oldQuantity} + ${ticketQuantity} = ${newQuantity}`);
                }
              } else {
                // Vé mới - thêm mới
                const ticketPayload = {
                  order_id: orderId,
                  food_item_id: ticketFoodItemId,
                  quantity: ticketQuantity,
                  unit_price: ticketPrice,
                  total_price: ticketTotal,
                  special_instructions: 'Vé buffet'
                };
                
                console.log('📝 Ticket insert payload:', ticketPayload);
                
                const { data: insertData, error: insertError } = await supabase
                  .from('order_items')
                  .insert(ticketPayload)
                  .select('*');
                
                if (insertError) {
                  console.error(`❌ Failed to insert ticket ${ticketFoodItemId}:`, insertError);
                } else {
                  console.log(`✅ Added new ticket ${ticketFoodItemId}:`, insertData);
                }
              }
            }
          }

          // 2. Lưu các món ăn vào order_items
          if (Array.isArray(items) && items.length > 0) {
            console.log('🔄 Processing food items for order_items:', items);
            
            for (const item of items) {
              const unitPrice = Number(item.price || item.unit_price || 0);
              const quantity = Number(item.quantity || 0);
              const totalPrice = unitPrice * quantity;
              
              console.log(`Processing item:`, {
                food_item_id: item.food_item_id,
                quantity: quantity,
                price: unitPrice,
                total: totalPrice,
                original_item: item
              });
              
              // Nếu quantity = 0, bỏ qua (giữ nguyên số lượng cũ)
              if (quantity === 0) {
                console.log(`⏭️ Skipping item ${item.food_item_id} with quantity 0 (keeping existing quantity)`);
                continue;
              }
              
              // Kiểm tra xem món đã tồn tại chưa
              const { data: existingItem } = await supabase
                .from('order_items')
                .select('id, quantity, unit_price, total_price')
                .eq('order_id', orderId)
                .eq('food_item_id', item.food_item_id)
                .maybeSingle();

              if (existingItem) {
                // Món đã tồn tại - cộng dồn số lượng
                const oldQuantity = Number(existingItem.quantity || 0);
                const newQuantity = oldQuantity + quantity;
                const newTotalPrice = unitPrice * newQuantity;
                
                console.log(`🔄 Updating existing item ${item.food_item_id}: ${oldQuantity} + ${quantity} = ${newQuantity}`);
                
                const { error: updateError } = await supabase
                  .from('order_items')
                  .update({ 
                    quantity: newQuantity, 
                    total_price: newTotalPrice 
                  })
                  .eq('id', existingItem.id);
                
                if (updateError) {
                  console.error(`❌ Failed to update item ${item.food_item_id}:`, updateError);
                } else {
                  console.log(`✅ Updated existing item ${item.food_item_id}: ${oldQuantity} + ${quantity} = ${newQuantity}`);
                }
              } else {
                // Món mới - thêm mới
                const insertPayload = {
                  order_id: orderId,
                  food_item_id: item.food_item_id,
                  quantity: quantity,
                  unit_price: unitPrice,
                  total_price: totalPrice,
                  special_instructions: item.special_instructions || (item.is_unlimited ? 'Gọi thoải mái' : '')
                };
                
                console.log('📝 Insert payload:', insertPayload);
                
                const { data: insertData, error: insertError } = await supabase
                  .from('order_items')
                  .insert(insertPayload)
                  .select('*');
                
                if (insertError) {
                  console.error(`❌ Failed to insert item ${item.food_item_id}:`, insertError);
                } else {
                  console.log(`✅ Added new item ${item.food_item_id}:`, insertData);
                }
              }
            }
          } else {
            console.log('⚠️ No food items to process or items is not an array:', items);
          }

          // Verify items were saved
          const { data: savedItems, error: verifyError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

          if (verifyError) {
            console.error('❌ Error verifying saved items:', verifyError);
          } else {
            console.log(`✅ Verification: ${savedItems.length} items saved for order ${orderId}:`, savedItems);
          }

          // In bếp khi tạo order mới
          try {
            const host = (typeof window !== 'undefined' && (window as any).location) ? (window as any).location.hostname : 'localhost';
            const agentBase = `http://${host}:9977`;
            
            // Fetch mappings
            const { data: mappings } = await supabase
              .from('printer_mappings')
              .select('group_key, printer_uri');
            const groupToPrinter: Record<string, string> = {};
            (mappings || []).forEach((m: any) => { groupToPrinter[m.group_key] = m.printer_uri; });
            
            // Lấy thông tin chi tiết món ăn để in
            const { data: foodItems } = await supabase
              .from('food_items')
              .select('id, name')
              .in('id', items.map((it: any) => it.food_item_id));
            
            const foodMap: Record<number, string> = {};
            (foodItems || []).forEach((item: any) => {
              foodMap[item.id] = item.name;
            });
            
            const text = items.map((it: any) => {
              const foodName = foodMap[it.food_item_id] || `ITEM ${it.food_item_id}`;
              const note = it.special_instructions && it.special_instructions !== 'Gọi thoải mái' ? ` - ${it.special_instructions}` : '';
              return `x${it.quantity} - ${foodName}${note}`;
            }).join('\n');
            
            // In ra máy in bếp (kitchen_other)
            const uri = groupToPrinter['kitchen_other'];
            if (uri) {
              await fetch(`${agentBase}/print`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ printerUri: uri, title: `Order ${orderId}`, rawText: text })
              });
              console.log('🖨️ Kitchen print sent for order:', orderId);
            }
          } catch (e) {
            console.warn('🖨️ Kitchen print skip:', e);
          }

          const axiosLike = { data: orderData, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
          resolve(axiosLike);

        } catch (error) {
          console.error('❌ Unexpected error in createOrder:', error);
          reject(error);
        }
      });
    }
    return api.post('/orders', data);
  },
  updateOrder: (id: number, data: any): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        const { items, ...order } = data;
        const updatePayload = { 
          ...order,
          // items: items || [] // Tạm thời comment vì cột chưa tồn tại
        };
        supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', id)
          .select('*')
          .maybeSingle()
          .then(async (res: any) => {
            if (res.error) { reject(res.error); return; }
            // 1. Cập nhật vé buffet vào order_items (nếu có)
            if (updatePayload.buffet_package_id && updatePayload.buffet_quantity > 0) {
              console.log('🎫 Processing buffet ticket update for order_items:', {
                buffet_package_id: updatePayload.buffet_package_id,
                buffet_quantity: updatePayload.buffet_quantity
              });
              
              // Lấy thông tin vé buffet
              const { data: buffetPackage } = await supabase
                .from('buffet_packages')
                .select('id, name, price')
                .eq('id', updatePayload.buffet_package_id)
                .single();
              
              if (buffetPackage) {
                const ticketFoodItemId = updatePayload.buffet_package_id; // ID vé = buffet_package_id
                const ticketQuantity = Number(updatePayload.buffet_quantity || 1);
                const ticketPrice = Number(buffetPackage.price || 0);
                const ticketTotal = ticketPrice * ticketQuantity;
                
                console.log(`🎫 Updating buffet ticket: ${buffetPackage.name} x${ticketQuantity} = ${ticketTotal}₫`);
                
                // Kiểm tra xem vé đã tồn tại chưa
                const { data: existingTicket } = await supabase
                  .from('order_items')
                  .select('id, quantity, unit_price, total_price')
                  .eq('order_id', id)
                  .eq('food_item_id', ticketFoodItemId)
                  .maybeSingle();

                if (existingTicket) {
                  // Vé đã tồn tại - cộng dồn số lượng
                  const oldQuantity = Number(existingTicket.quantity || 0);
                  const newQuantity = oldQuantity + ticketQuantity;
                  const newTotalPrice = ticketPrice * newQuantity;
                  
                  console.log(`🔄 Updating existing ticket ${ticketFoodItemId}: ${oldQuantity} + ${ticketQuantity} = ${newQuantity}`);
                  
                  await supabase
                    .from('order_items')
                    .update({ 
                      quantity: newQuantity, 
                      total_price: newTotalPrice 
                    })
                    .eq('id', existingTicket.id);
                  
                  console.log(`✅ Updated existing ticket ${ticketFoodItemId}: ${oldQuantity} + ${ticketQuantity} = ${newQuantity}`);
                } else {
                  // Vé mới - thêm mới
                  const ticketPayload = {
                    order_id: id,
                    food_item_id: ticketFoodItemId,
                    quantity: ticketQuantity,
                    unit_price: ticketPrice,
                    total_price: ticketTotal,
                    special_instructions: 'Vé buffet'
                  };
                  
                  console.log('📝 Ticket insert payload:', ticketPayload);
                  
                  const { data: insertData, error: insertError } = await supabase
                    .from('order_items')
                    .insert(ticketPayload)
                    .select('*');
                  
                  if (insertError) {
                    console.error(`❌ Failed to insert ticket ${ticketFoodItemId}:`, insertError);
                  } else {
                    console.log(`✅ Added new ticket ${ticketFoodItemId}:`, insertData);
                  }
                }
              }
            }

            // 2. Cập nhật các món ăn vào order_items
            if (Array.isArray(items) && items.length > 0) {
              console.log('🔄 Updating food items for order_items:', items);
              
              for (const item of items) {
                const unitPrice = Number(item.price || item.unit_price || 0);
                const quantity = Number(item.quantity || 0);
                const totalPrice = unitPrice * quantity;
                
                console.log(`Updating item: food_item_id=${item.food_item_id}, quantity=${quantity}, price=${unitPrice}, total=${totalPrice}`);
                
                // Nếu quantity = 0, bỏ qua (giữ nguyên số lượng cũ)
                if (quantity === 0) {
                  console.log(`⏭️ Skipping item ${item.food_item_id} with quantity 0 (keeping existing quantity)`);
                  continue;
                }
                
                // Kiểm tra xem món đã tồn tại chưa
                const { data: existingItem } = await supabase
                  .from('order_items')
                  .select('id, quantity, unit_price, total_price')
                  .eq('order_id', id)
                  .eq('food_item_id', item.food_item_id)
                  .maybeSingle();

                if (existingItem) {
                  // Món đã tồn tại - cộng dồn số lượng
                  const oldQuantity = Number(existingItem.quantity || 0);
                  const newQuantity = oldQuantity + quantity;
                  const newTotalPrice = unitPrice * newQuantity;
                  
                  console.log(`🔄 Updating existing item ${item.food_item_id}: ${oldQuantity} + ${quantity} = ${newQuantity}`);
                  
                  await supabase
                    .from('order_items')
                    .update({ 
                      quantity: newQuantity, 
                      total_price: newTotalPrice 
                    })
                    .eq('id', existingItem.id);
                  
                  console.log(`✅ Updated existing item ${item.food_item_id}: ${oldQuantity} + ${quantity} = ${newQuantity}`);
                } else {
                  // Món mới - thêm mới
                  const insertResult = await supabase.from('order_items').insert({
                    order_id: id,
                    food_item_id: item.food_item_id,
                    quantity: quantity,
                    unit_price: unitPrice,
                    total_price: totalPrice,
                    employee_id: order.employee_id,
                    special_instructions: item.special_instructions || (item.is_unlimited ? 'Gọi thoải mái' : '')
                  });
                  
                  if (insertResult.error) {
                    console.error(`❌ Failed to insert item ${item.food_item_id}:`, insertResult.error);
                  } else {
                    console.log(`✅ Added new item ${item.food_item_id}: ${quantity} x ${unitPrice} = ${totalPrice}`);
                  }
                }
              }
            } else {
              console.log('⚠️ No food items to update or items is not an array');
            }
            
            // In bếp khi cập nhật order
            if (Array.isArray(items) && items.length > 0) {
              try {
                const host = (typeof window !== 'undefined' && (window as any).location) ? (window as any).location.hostname : 'localhost';
                const agentBase = `http://${host}:9977`;
                
                // Fetch mappings
                const { data: mappings } = await supabase
                  .from('printer_mappings')
                  .select('group_key, printer_uri');
                const groupToPrinter: Record<string, string> = {};
                (mappings || []).forEach((m: any) => { groupToPrinter[m.group_key] = m.printer_uri; });
                
                // Lấy thông tin chi tiết món ăn để in
                const { data: foodItems } = await supabase
                  .from('food_items')
                  .select('id, name')
                  .in('id', items.map((it: any) => it.food_item_id));
                
                const foodMap: Record<number, string> = {};
                (foodItems || []).forEach((item: any) => {
                  foodMap[item.id] = item.name;
                });
                
                const text = items.map((it: any) => {
                  const foodName = foodMap[it.food_item_id] || `ITEM ${it.food_item_id}`;
                  const note = it.special_instructions && it.special_instructions !== 'Gọi thoải mái' ? ` - ${it.special_instructions}` : '';
                  return `x${it.quantity} - ${foodName}${note}`;
                }).join('\n');
                
                // In ra máy in bếp (kitchen_other)
                const uri = groupToPrinter['kitchen_other'];
                if (uri) {
                  await fetch(`${agentBase}/print`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ printerUri: uri, title: `Order Update ${id}`, rawText: text })
                  });
                  console.log('🖨️ Kitchen print sent for order update:', id);
                }
              } catch (e) {
                console.warn('🖨️ Kitchen print skip:', e);
              }
            }
            
            const axiosLike = { data: { ...res.data }, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
            resolve(axiosLike);
          }, reject);
      });
    }
    return api.put(`/orders/${id}`, data);
  },
  updateOrderItemQuantity: (orderId: number, foodItemId: number, newQuantity: number): Promise<AxiosResponse<any>> => {
    if (USE_SUPABASE) {
      return new Promise((resolve, reject) => {
        if (newQuantity <= 0) {
          // Xóa item nếu số lượng <= 0
          supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId)
            .eq('food_item_id', foodItemId)
            .then((res: any) => {
              if (res.error) { reject(res.error); return; }
              const axiosLike = { data: { deleted: true }, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
              resolve(axiosLike);
            }, reject);
        } else {
          // Cập nhật số lượng - cần lấy unit_price trước
          supabase
            .from('order_items')
            .select('unit_price')
            .eq('order_id', orderId)
            .eq('food_item_id', foodItemId)
            .single()
            .then(async (priceRes: any) => {
              if (priceRes.error) { reject(priceRes.error); return; }
              
              const unitPrice = priceRes.data?.unit_price || 0;
              const newTotal = unitPrice * newQuantity;
              
              supabase
                .from('order_items')
                .update({ 
                  quantity: newQuantity,
                  total_price: newTotal
                })
                .eq('order_id', orderId)
                .eq('food_item_id', foodItemId)
                .then((res: any) => {
                  if (res.error) { reject(res.error); return; }
                  const axiosLike = { data: res.data, status: 200, statusText: 'OK', headers: {}, config: {} as any } as AxiosResponse<any>;
                  resolve(axiosLike);
                }, reject);
            }, reject);
        }
      });
    }
    return api.put(`/orders/${orderId}/items/${foodItemId}`, { quantity: newQuantity });
  },
};

export default api;
