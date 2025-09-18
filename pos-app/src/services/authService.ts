import axios from 'axios';
import { Employee } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_employee');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(employeeCode: string, password: string): Promise<{ employee: Employee; token: string }> {
    try {
      const response = await api.post('/auth/login', {
        employee_code: employeeCode,
        password: password,
      });

      const { employee, token } = response.data;
      
      // Store token and employee info
      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_employee', JSON.stringify(employee));
      
      return { employee, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  async getCurrentEmployee(): Promise<Employee | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_employee');
  },

  getStoredEmployee(): Employee | null {
    const stored = localStorage.getItem('pos_employee');
    return stored ? JSON.parse(stored) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('pos_token');
  },

  isAuthenticated(): boolean {
    return !!(this.getToken() && this.getStoredEmployee());
  }
};

export default api;

