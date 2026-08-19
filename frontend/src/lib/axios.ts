import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Lấy token từ Zustand store (đã được persist vào localStorage)
      let token = useAuthStore.getState().token;

      // Fallback: đọc thẳng từ localStorage nếu Zustand chưa hydrate
      if (!token) {
        try {
          const persisted = localStorage.getItem('auth-storage');
          if (persisted) {
            const parsed = JSON.parse(persisted);
            token = parsed?.state?.token || null;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - tự động logout khi token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if ((error?.response?.status === 401 || error?.response?.status === 403) && typeof window !== 'undefined' && !originalRequest._retry) {
      if (
        originalRequest.url.includes('/auth/login') || 
        originalRequest.url.includes('/auth/refresh') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/verify-registration')
      ) {
        if (!originalRequest.url.includes('/auth/register') && !originalRequest.url.includes('/auth/verify-registration')) {
          useAuthStore.getState().logout();
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(apiUrl + '/auth/refresh', {}, { withCredentials: true });
        
        if (res.data.token) {
          useAuthStore.getState().updateToken(res.data.token);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token;
          originalRequest.headers['Authorization'] = 'Bearer ' + res.data.token;
          
          processQueue(null, res.data.token);
          
          return api(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
