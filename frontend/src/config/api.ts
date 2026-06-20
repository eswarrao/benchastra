// src/config/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
  REFRESH_TOKEN: '/auth/refresh',
  USER_ME: '/users/me',
  UPDATE_USER: '/users/me',
  REQUIREMENTS: '/requirements',
  REQUIREMENT_MATCHES: (id: number) => `/requirements/${id}/matches`,
  RESOURCES: '/resources',
  CONTRACTS: '/contracts',
  CONTRACT_STATUS: (id: number) => `/contracts/${id}/status`,
  CLIENT_STATS: '/dashboard/client/stats',
  VENDOR_STATS: '/dashboard/vendor/stats',
  VENDOR_TRENDS: '/analytics/vendor/availability-trend',
  BILLING_PLANS: '/billing/plans',
  BILLING_INVOICES: '/billing/invoices',
  UPGRADE_SUBSCRIPTION: '/subscriptions/upgrade',
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/notifications/read-all',
  MESSAGES: '/messages',
  UNREAD_COUNT: '/messages/unread/count',
};

// Token management functions
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (exp) {
      const now = Math.floor(Date.now() / 1000);
      return now >= exp;
    }
    return false;
  } catch (e) {
    return true;
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token') || localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem('app_nav_state');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('userRole');
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // ADD THIS
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};

// Main API request function - ADD THE HEADER HERE
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> {
  const maxRetries = 1;
  
  let token = getToken();
  
  if (token && isTokenExpired(token)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
    } else {
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  // ADD THE ngrok-skip-browser-warning HEADER HERE
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // ← THIS IS THE KEY FIX
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retryCount < maxRetries) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest(endpoint, options, retryCount + 1);
    } else {
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

// Helper functions
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}