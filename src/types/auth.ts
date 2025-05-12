export interface User {
  userId: string;
  username: string;
  userEmail: string;
  userRole?: boolean;
}

export interface LoginCredentials {
  userId: string;
  userPassword: string;
}

export interface RegisterCredentials {
  username: string;
  userId: string;
  userPassword: string;
  userEmail: string;
  userRole?: boolean;
  confirmPassword: string;
}

export interface AuthResponse {
  token?: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
} 