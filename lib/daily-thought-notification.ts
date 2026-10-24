import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "treksor.daily-thought.local.v1";
const HOUR = 9;

// Schedule the current published thought only. A server push scheduler is still
// required for reliable delivery on days the app is not opened.
export async function scheduleTodaysPowerThought(thought: string, thoughtId: string): Promise<void> {
  if (!thought.trim() || !thoughtId) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const now = new Date();
  const day = [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
  const marker = day + ":" + thoughtId;
  const previous = await AsyncStorage.getItem(KEY);
  if (previous === marker) return;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), HOUR, 0, 0);
  if (target.getTime() <= now.getTime()) return;
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of existing) {
    if (item.content.data?.treksorDailyThought === true) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "TREKSOR · POWER THOUGHT",
      body: thought.trim().slice(0, 180),
      sound: "default",
      data: { treksorDailyThought: true, route: "/mental/thoughts" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
  await AsyncStorage.setItem(KEY, marker);
}
