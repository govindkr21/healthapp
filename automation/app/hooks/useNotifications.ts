import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Only set the handler on native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');

  useEffect(() => {
    // Push tokens are not supported on web
    if (Platform.OS === 'web') return;

    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });
  }, []);

  const scheduleDailyReminder = useCallback(async () => {
    // Scheduling is not supported on web
    if (Platform.OS === 'web') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Daily log reminder at 8 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Log Your Meals! 🍏",
        body: "Don't forget to track your dinner and keep your streak alive!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    // Daily summary at 10 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Summary 📊",
        body: "You've logged great meals today! Check your summary in the app.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 22,
        minute: 0,
      },
    });
  }, []);

  return { expoPushToken, scheduleDailyReminder };
};

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Push tokens only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Push tokens are not available on simulators/emulators.');
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted for push notifications.');
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Get projectId from app config (needed for Expo push service)
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    console.log('[Notifications] Push token:', tokenData.data);
    return tokenData.data;
  } catch (e) {
    console.warn('[Notifications] Failed to get push token:', e);
    return undefined;
  }
}
