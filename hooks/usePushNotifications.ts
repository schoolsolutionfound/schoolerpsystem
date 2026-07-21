import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useUserStore } from '../store/useUserStore';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const userRole = useUserStore((state) => state.userRole);
  const schoolId = useUserStore((state) => state.schoolId);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!schoolId) return;

    registerForPushNotificationsAsync().then(token => setExpoPushToken(token || ''));

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, [schoolId]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
