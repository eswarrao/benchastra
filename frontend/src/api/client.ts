// import { API_CONFIG, ENDPOINTS } from '../config/api';

// class ApiClient {
//   private token: string | null = null;

//   constructor() {
//     this.token = localStorage.getItem('access_token');
//   }

//   setToken(token: string) {
//     this.token = token;
//     localStorage.setItem('access_token', token);
//   }

//   clearToken() {
//     this.token = null;
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//   }

//   getToken() {
//     return this.token;
//   }

//   // Helper to normalize endpoint (remove trailing slash)
//   private normalizeEndpoint(endpoint: string): string {
//     // Remove trailing slash if present, but keep root slash
//     return endpoint.endsWith('/') && endpoint !== '/' ? endpoint.slice(0, -1) : endpoint;
//   }

//   private async request(endpoint: string, options: RequestInit = {}) {
//     const normalizedEndpoint = this.normalizeEndpoint(endpoint);
//     const url = `${API_CONFIG.baseURL}${normalizedEndpoint}`;

//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     };

//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     console.log(`API Request: ${options.method || 'GET'} ${url}`);
//     console.log('Headers:', headers);

//     try {
//       const response = await fetch(url, {
//         ...options,
//         headers,
//       });

//       console.log(`API Response: ${response.status} ${response.statusText}`);

//       if (response.status === 401) {
//         // Try to refresh token
//         const refreshed = await this.refreshToken();
//         if (refreshed) {
//           // Retry the request with new token
//           headers['Authorization'] = `Bearer ${this.token}`;
//           const retryResponse = await fetch(url, {
//             ...options,
//             headers,
//           });
//           return retryResponse;
//         } else {
//           this.clearToken();
//           window.location.href = '/login';
//           throw new Error('Session expired');
//         }
//       }

//       return response;
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   }

//   private async refreshToken(): Promise<boolean> {
//     const refreshToken = localStorage.getItem('refresh_token');
//     if (!refreshToken) return false;

//     try {
//       const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ refresh_token: refreshToken }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         this.setToken(data.access_token);
//         localStorage.setItem('refresh_token', data.refresh_token);
//         return true;
//       }
//     } catch (error) {
//       console.error('Token refresh failed:', error);
//     }
//     return false;
//   }

//   async get(endpoint: string, params?: Record<string, any>) {
//     let url = endpoint;
//     if (params) {
//       const queryParams = new URLSearchParams(params).toString();
//       url = `${endpoint}?${queryParams}`;
//     }
//     const response = await this.request(url);
//     return response.json();
//   }

//   async post(endpoint: string, data: any) {
//     const response = await this.request(endpoint, {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   }

//   async put(endpoint: string, data: any) {
//     const response = await this.request(endpoint, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   }

//   async delete(endpoint: string) {
//     const response = await this.request(endpoint, {
//       method: 'DELETE',
//     });
//     return response.json();
//   }

//   async upload(endpoint: string, file: File) {
//     const formData = new FormData();
//     formData.append('file', file);

//     const normalizedEndpoint = this.normalizeEndpoint(endpoint);
//     const url = `${API_CONFIG.baseURL}${normalizedEndpoint}`;
//     const headers: HeadersInit = {};

//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     const response = await fetch(url, {
//       method: 'POST',
//       headers,
//       body: formData,
//     });

//     return response.json();
//   }
// }

// export const api = new ApiClient();

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
    private getToken(): string | null {
        return localStorage.getItem('token') || localStorage.getItem('access_token');
    }

    private setToken(token: string): void {
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem('refresh_token', token);
    }

    clearTokens(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            this.clearTokens();
            window.location.href = '/login';
        }

        return response;
    }

    async get(endpoint: string) {
        const response = await this.request(endpoint);
        return response.json();
    }

    async post(endpoint: string, data: any) {
        const response = await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.json();
    }

    async put(endpoint: string, data: any) {
        const response = await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.json();
    }

    async delete(endpoint: string) {
        const response = await this.request(endpoint, {
            method: 'DELETE',
        });
        return response.json();
    }
}

export const api = new ApiClient();