import { useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useUserStore } from '../../../store/useUserStore';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // Ignore in Expo Go or environment without native push support
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const institutionId = useUserStore((state) => state.institutionId);

  useEffect(() => {
    if (isExpoGo || Platform.OS === 'web' || !Notifications) return;
    if (!institutionId) return;

    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token || ''));

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, [institutionId]);

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
      // Skip token fetch when running in local dev / without EAS project setup
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error: any) {
    console.warn('[Push Notifications Warning] Could not register push token:', error.message);
    return null;
  }
}
