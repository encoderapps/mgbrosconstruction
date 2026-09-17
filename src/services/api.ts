import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import { getAuthToken } from '../utils/secureStorage';
import { ApiErrorPayload } from '../types';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface NormalizedApiError {
  status: number | null;
  message: string;
  errors?: ApiErrorPayload['errors'];
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const normalized: NormalizedApiError = {
      status: error.response?.status ?? null,
      message: error.response?.data?.message ?? error.message ?? 'Something went wrong. Please try again.',
      errors: error.response?.data?.errors,
    };
    return Promise.reject(normalized);
  },
);
