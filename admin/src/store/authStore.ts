import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
  token: string | null;
  user: any;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  user: null,
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
}));
