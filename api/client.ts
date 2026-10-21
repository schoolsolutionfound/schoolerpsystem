import { auth } from '../firebaseConfig';
import { AppError } from '../utils/errorHandler';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
const getBaseUrl = (): string => {
  // Extract host IP dynamically when running on physical devices/emulators via Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
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

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (!headers['Authorization']) {
    // Dev bypass fallback
    if (!token) {
      try {
        const { useUserStore } = await import('../store/useUserStore');
        const role = useUserStore.getState().userRole;
        if (role === 'student') {
          token = 'dev-hardcoded-student-token';
        } else {
          token = 'dev-hardcoded-driver-token';
        }
      } catch {
        token = 'dev-hardcoded-driver-token';
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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
