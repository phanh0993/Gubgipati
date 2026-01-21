// API Configuration cho POS Desktop App
// Chạy local, kết nối với backend local

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function để tạo full API URL
export const getApiUrl = (endpoint: string): string => {
  // Nếu endpoint đã có full URL, return nguyên
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Nếu endpoint không bắt đầu bằng /, thêm vào
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${API_BASE_URL}${path}`;
};

// Wrapper fetch với API base URL
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

export default {
  API_BASE_URL,
  getApiUrl,
  apiFetch,
};

