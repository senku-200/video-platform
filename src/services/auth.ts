import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '@/types/auth';
import api from '@/lib/api';

// Mock user database
const MOCK_USERS = new Map();

// Mock JWT generation (in real app, use proper JWT library)
const generateToken = (userId: string): string => {
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/login', credentials);
      
      if (response.data.token) {
        // Store user ID from credentials since backend doesn't return user info
        const user: User = {
          userId: credentials.userId,
          username: '', // Will be populated on subsequent requests
          userEmail: '',
          userRole: false
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', response.data.token);
        
        // Set token in cookie
        document.cookie = `token=${response.data.token}; path=/`;
      }
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = credentials;
      const response = await api.post<AuthResponse>('/signup', registerData);
      
      if (response.data.token) {
        // Store user info
        const user: User = {
          userId: credentials.userId,
          username: credentials.username,
          userEmail: credentials.userEmail,
          userRole: credentials.userRole
        };
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Remove token from cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch (error: any) {
      console.error('Logout failed:', error);
    }
  },

  async validateToken(): Promise<boolean> {
    try {
      const response = await api.get('/home');
      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}; 