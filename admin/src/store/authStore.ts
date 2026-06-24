import { create } from 'zustand';
import axios from 'axios';

// Attach Bearer token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (skip for login endpoint to avoid redirect loops)
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/admin/login')) {
      localStorage.removeItem('admin_token');
      window.location.replace('/admin/login');
    }
    return Promise.reject(err);
  },
);

interface AuthState {
  token: string | null;
  user: { username: string; role: string } | null;
  validating: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  user: null,
  validating: !!localStorage.getItem('admin_token'),
  login: async (username, password) => {
    const res = await axios.post('/api/v1/admin/login', { username, password });
    const { token, user } = res.data.data;
    localStorage.setItem('admin_token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, user: null });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      set({ validating: false });
      return;
    }
    try {
      await axios.get('/api/v1/admin/stats');
      set({ validating: false });
    } catch {
      localStorage.removeItem('admin_token');
      set({ token: null, user: null, validating: false });
    }
  },
}));
