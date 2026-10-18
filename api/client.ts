import { auth } from '../firebaseConfig';
import { AppError } from '../utils/errorHandler';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
const getBaseUrl = (): string => {
  // On web in PC browser, always connect to the matching hostname that served the web app
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const webHost = window.location.hostname;
    return `http://${webHost}:5000/api/v1`;
  }

  // In development, dynamically connect to the active Metro host IP (handles mobile on Wi-Fi automatically)
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5000/api/v1`;
      }
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

    return (data.data !== undefined ? data.data : data) as T;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.log(`[API Client Network Info] Fastify API at ${url} unavailable (${error.message}). App falling back to cloud services.`);
    throw new AppError(`API Network Error: Could not connect to backend server at ${url}.`, 'NETWORK_ERROR', 503);
  }
}
