import { api } from './api';
import { ApiResponse, AuthResponse, User } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  return data.data as AuthResponse;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return data.data as AuthResponse;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return (data.data as { user: User }).user;
}
