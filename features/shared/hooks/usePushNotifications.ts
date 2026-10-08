import { useEffect, useState, useCallback, useRef } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { registerPushTokenApi, unregisterPushTokenApi } from '../../../api/notifications';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    // Ignore in Expo Go or environment without native push support
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const institutionCode = useUserStore((state) => state.institutionCode);
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const registeredTokenRef = useRef<string>('');

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
  }, []);

  const registerTokenWithBackend = useCallback(
    async (token: string) => {
      if (!token || !userId || !institutionCode) return;
      try {
        await registerPushTokenApi({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          deviceName: `${Platform.OS} device`,
        });
        registeredTokenRef.current = token;
      } catch (error: any) {
        console.warn('[Push] Failed to register token with backend:', error.message);
      }
    },
    [userId, institutionCode]
  );

  useEffect(() => {
    if (isExpoGo || Platform.OS === 'web' || !Notifications) return;
    if (!institutionCode || !userId) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerTokenWithBackend(token);
      }
    });

    // Cleanup: unregister token when user logs out
    return () => {
      if (registeredTokenRef.current) {
        unregisterPushTokenApi(registeredTokenRef.current).catch(() => {});
        registeredTokenRef.current = '';
      }
    };
  }, [institutionCode, userId, registerTokenWithBackend]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync() {
  if (isExpoGo || Platform.OS === 'web' || !Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error: any) {
    console.warn('[Push Notifications Warning] Could not register push token:', error.message);
    return null;
  }
}
