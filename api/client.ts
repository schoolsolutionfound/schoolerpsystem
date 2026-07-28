import { auth } from '../firebaseConfig';
import { AppError } from '../utils/errorHandler';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useUserStore } from '../store/useUserStore';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Extract host IP dynamically when running on physical devices/emulators via Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';
};

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const currentUser = auth.currentUser;
  let token = '';

  if (currentUser) {
    try {
      token = await currentUser.getIdToken();
    } catch {
      token = '';
    }
  }

  // Developer Experience (DX) Fallback: Attach mock token if in local Dev Bypass mode
  if (!token && useUserStore.getState().isBypassUser) {
    token = 'mock_dev_token';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const msg = data?.error?.message || `HTTP Error ${response.status}`;
      const code = data?.error?.code || 'API_ERROR';
      throw new AppError(msg, code, response.status);
    }

    return data.data as T;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.warn(`[API Client Network Warning] Failed to reach Fastify API at ${url}: ${error.message}`);
    throw new AppError(`API Network Error: Could not connect to backend server at ${url}.`, 'NETWORK_ERROR', 503);
  }
}
