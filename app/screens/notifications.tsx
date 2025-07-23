import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FL_SEASONS from './CalendarScreen';

type SeasonKey = keyof typeof FL_SEASONS;
type SeasonRange = { start: string; end: string };

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Push notification permission denied!');
            return;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem('expoPushToken', token);
    } else {
        alert('Must use physical device for push notifications');
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD700',
        });
    }

    return token;
}



export async function scheduleSeasonNotifications() {
    const species = Object.keys(FL_SEASONS) as SeasonKey[];
    const now = new Date();

for (const key of species) {
    const animal = key as string;
    const ranges = FL_SEASONS[key as SeasonKey] as SeasonRange[];

        for (const { start, end } of ranges) {
            const startDate = new Date(start);
            const endDate = new Date(end);

            const notifyStart = new Date(startDate);
            notifyStart.setDate(startDate.getDate() - 3);

            const notifyEnd = new Date(endDate);
            notifyEnd.setDate(endDate.getDate() - 3);

            // Only schedule if date is in the future
            if (notifyStart > now) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `${animal.toUpperCase()} season opens soon!`,
                        body: `The season starts on ${startDate.toDateString()}`,
                        sound: 'default',
                    },
                    trigger: {
                        seconds: Math.floor((notifyStart.getTime() - Date.now()) / 1000),
                        channelId: 'default', 
                    }
                });
            }

            if (notifyEnd > now) {

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `${animal.toUpperCase()} season is ending soon!`,
                        body: `The season ends on ${endDate.toDateString()}`,
                        sound: 'default',
                    },
                    trigger: {
                        seconds: Math.floor((notifyStart.getTime() - Date.now()) / 1000),
                        channelId: 'default',
                    }
                });
            }
        }
    }

    await AsyncStorage.setItem('seasonNotificationsSet', 'true');
}