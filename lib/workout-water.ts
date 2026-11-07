import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutStore } from "@/store/workout-store";

const reminderId = (session: string) => "treksor-workout-water-" + session;
const channel = "workout-water";
export const waterDelayMinutes = 30;

export async function hasWaterReminder(session: string) {
  return (await Notifications.getAllScheduledNotificationsAsync())
    .some((notification) => notification.identifier === reminderId(session));
}

export async function cancelWaterReminder(session: string) {
  await Notifications.cancelScheduledNotificationAsync(reminderId(session));
}

export async function scheduleWaterReminder(session: string) {
  const owner = useAuthStore.getState().user?.id;
  const stillTraining = () => !!owner && useAuthStore.getState().isAuthenticated
    && useAuthStore.getState().user?.id === owner && useWorkoutStore.getState().activeGymWorkout?.id === session;
  if (!stillTraining()) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(channel, {
      name: "Workout water reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw Error("Allow Treksor notifications in Settings to use reminders.");
  if (!stillTraining()) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: reminderId(session),
    content: { title: "Treksor · Water break", body: "Take a moment for water when you’re ready.", sound: "default" },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + waterDelayMinutes * 60_000),
      ...(Platform.OS === "android" ? { channelId: channel } : {}),
    },
  });
  if (stillTraining()) return true;
  await cancelWaterReminder(session);
  return false;
}
