import { apiClient } from '@/lib/api/api-client';
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  RegisterPayload,
  RegisterResponse,
} from '../types/auth.types';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload, { skipAuthRetry: true }),

  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>('/auth/register', payload, { skipAuthRetry: true }),

  refresh: () =>
    apiClient.post<RefreshResponse>('/auth/refresh', undefined, { skipAuthRetry: true }),

  logout: () => apiClient.post<{ success: boolean }>('/auth/logout'),

  me: () => apiClient.get<MeResponse>('/auth/me'),
};
