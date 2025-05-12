export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface HomeResponse {
  message: string;
}

export interface AuthApiResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
} 