import { auth } from '../firebaseConfig';
import { AppError } from '../utils/errorHandler';
import { debugLog, debugWarn } from '../utils/debugLogger';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
const getBaseUrl = (): string => {
  // 1. On web in PC browser, always connect to the matching hostname that served the web app
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const webHost = window.location.hostname;
    return `http://${webHost}:5000/api/v1`;
  }

  // 2. Explicit API URL defined in .env (takes precedence over stale/cached network interfaces)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. In development fallback, dynamically connect to active Metro host IP
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5000/api/v1`;
      }
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

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body !== undefined && options.body !== null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = (options.method || 'GET').toUpperCase();
  const startedAt = Date.now();
  debugLog('API', `${method} ${endpoint}`, {
    authenticated: !!currentUser,
    uid: currentUser?.uid ?? null,
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutMs = 8000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('REQUEST_TIMEOUT'));
    }, timeoutMs);
  });

  // Strip signal to avoid Expo Android NativeRequest crash
  const { signal: _ignoredSignal, ...fetchOptions } = options;

  const fetchPromise = (async () => {
    return await fetch(url, {
      ...fetchOptions,
      headers,
    });
  })();

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    const data = await response.json();
    debugLog('API', `${method} ${endpoint} response`, {
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
      success: data?.success,
    });

    if (!response.ok || data.success === false) {
      const msg = data?.error?.message || `HTTP Error ${response.status}`;
      const code = data?.error?.code || 'API_ERROR';
      debugWarn('API', `${method} ${endpoint} rejected`, {
        status: response.status,
        code,
        message: msg,
        durationMs: Date.now() - startedAt,
      });
      throw new AppError(msg, code, response.status);
    }

    return (data.data !== undefined ? data.data : data) as T;
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof AppError) throw error;
    const isTimeout = error.message === 'REQUEST_TIMEOUT';
    debugWarn('API', `${method} ${endpoint} network failure`, {
      url,
      timeout: isTimeout,
      message: error.message,
      durationMs: Date.now() - startedAt,
    });
    console.log(`[API Client Network Info] Fastify API at ${url} ${isTimeout ? 'timed out after 8s' : 'unavailable'} (${error.message}).`);
    throw new AppError(
      isTimeout
        ? `Connection timed out connecting to backend server at ${url}. Ensure mobile phone and PC are on the same Wi-Fi.`
        : `API Network Error: Could not connect to backend server at ${url}.`,
      'NETWORK_ERROR',
      503
    );
  }
}
