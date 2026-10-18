import { auth } from '../firebaseConfig';
import { AppError } from '../utils/errorHandler';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const hostIp = hostUri ? hostUri.split(':')[0] : null;

  if (envUrl) {
    // If running on web in localhost browser, map to localhost backend so requests don't fail when LAN IP changes
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
      return envUrl.replace(/https?:\/\/[^/:]+(:[0-9]+)?/, (match, port) => `http://localhost${port || ':5000'}`);
    }

    // If running on a physical mobile device and envUrl uses localhost/127.0.0.1,
    // dynamically swap it with the hotspot/LAN hostIp so requests don't fail
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1' && Platform.OS !== 'web' && /localhost|127\.0\.0\.1/.test(envUrl)) {
      return envUrl.replace(/localhost|127\.0\.0\.1/, hostIp);
    }
    return envUrl;
  }
  
  // Extract host IP dynamically when running on physical devices/emulators via Expo Go
  if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
    return `http://${hostIp}:5000/api/v1`;
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

    return data.data as T;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.warn(`[API Client Network Warning] Failed to reach Fastify API at ${url}: ${error.message}`);
    throw new AppError(`API Network Error: Could not connect to backend server at ${url}.`, 'NETWORK_ERROR', 503);
  }
}
