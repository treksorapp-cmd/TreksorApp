import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useNotificationInbox } from './useNotificationInbox';

export function useNotifications() {
    useNotificationInbox();
    const [pushToken, setPushToken] = useState<Notifications.ExpoPushToken | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();

    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        // Set notification handler once
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                // The foreground inbox writes the exact count. The OS handles
                // the badge in the push payload when the app is closed.
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        async function registerForPushNotification() {
            try {
                // Set up Android notification channel
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync("default", {
                        name: 'default',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#FF231F7C',
                        showBadge: true
                    });
                }
                // Check existing permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                // Request permissions if not granted
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:true}});
                    finalStatus = status;
                }

                // If permission is still not granted, return null
                if (finalStatus !== 'granted') {
                    console.warn("Push notification permission not granted");
                    return null;
                }

                // Get the push token
                const token = await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId,
                });



                return token;
            } catch (error) {
                console.error("Error registering for push notifications:", error);
                return null;
            }
        }

        // Register for push notifications
        registerForPushNotification()
            .then((token) => {
                if (token) {

                    setPushToken(token);
                } else {
                    console.warn("Failed to get push token");
                }
            })
            .catch((error) => {
                console.error("Error getting push token:", error);
            });

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((resp) => {
            // Navigation and unread state are handled by useNotificationInbox.
        });

        // Cleanup
        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return {
        pushToken,
        notification
    };
}
