import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, AuthContextType } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedEmployee = authService.getStoredEmployee();
          if (storedEmployee) {
            setEmployee(storedEmployee);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (employeeCode: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { employee: loggedInEmployee } = await authService.login(employeeCode, password);
      
      // Check if employee has POS access
      const posRoles = ['waiter', 'cashier', 'bartender', 'host', 'cook', 'chef'];
      if (!posRoles.includes(loggedInEmployee.role.toLowerCase())) {
        authService.logout();
        throw new Error('Tài khoản không có quyền truy cập POS');
      }

      setEmployee(loggedInEmployee);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Đăng nhập thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setEmployee(null);
  };

  const value: AuthContextType = {
    employee,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

