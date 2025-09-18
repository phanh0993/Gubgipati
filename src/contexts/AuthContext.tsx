import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginRequest } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'LOAD_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  setupAdmin: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('spa_token'),
  isLoading: true,
  isAuthenticated: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('spa_token');
      const savedUser = localStorage.getItem('spa_user');

      if (token && savedUser) {
        try {
          // Check if remember is enabled and token is not expired
          const remember = localStorage.getItem('spa_remember') === 'true';
          const expiry = localStorage.getItem('spa_token_expiry');
          const now = new Date().getTime();
          
          if (remember && expiry && now < parseInt(expiry)) {
            // Token is valid according to our local expiry, use it directly
            const user = JSON.parse(savedUser);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
            console.log('✅ Restored session from localStorage (remember login)');
          } else if (!remember) {
            // Try to verify with API if not remember login (legacy behavior)
            try {
              const response = await authAPI.getMe();
              dispatch({ type: 'LOAD_USER', payload: response.data.user });
              console.log('✅ Verified session with server');
            } catch (apiError) {
              // API verification failed, clear storage
              console.warn('Session verification failed, logging out');
              clearAuthStorage();
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            // Token expired according to local expiry, clear storage
            console.log('Session expired, logging out');
            clearAuthStorage();
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          // Error parsing saved data, clear storage
          console.error('Error loading saved session:', error);
          clearAuthStorage();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    const clearAuthStorage = () => {
      localStorage.removeItem('spa_token');
      localStorage.removeItem('spa_user');
      localStorage.removeItem('spa_token_expiry');
      localStorage.removeItem('spa_remember');
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginRequest, rememberMe: boolean = true) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;

      // Save to localStorage
      localStorage.setItem('spa_token', token);
      localStorage.setItem('spa_user', JSON.stringify(user));
      
      if (rememberMe) {
        // Set token expiry to 30 days for remember login
        const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
        localStorage.setItem('spa_token_expiry', expiry.toString());
        localStorage.setItem('spa_remember', 'true');
        console.log('✅ Login with remember me enabled (30 days)');
      } else {
        // Set shorter expiry for non-remember login (24 hours)
        const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('spa_token_expiry', expiry.toString());
        localStorage.setItem('spa_remember', 'false');
        console.log('✅ Login without remember me (24 hours)');
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const setupAdmin = async (data: any) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.setup(data);
      const { user, token } = response.data;

      // Save to localStorage
      localStorage.setItem('spa_token', token);
      localStorage.setItem('spa_user', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(error.response?.data?.error || 'Setup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('spa_token');
    localStorage.removeItem('spa_user');
    localStorage.removeItem('spa_token_expiry');
    localStorage.removeItem('spa_remember');
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setupAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
