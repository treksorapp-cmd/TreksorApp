import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationStore } from "@/store/notification-store";
import { noticeCount } from "@/lib/notification-inbox";
const KEY = "treksor.daily-thought.local.v1";
const HOUR = 9;
let scheduling: Promise<unknown> = Promise.resolve();
export function cancelThoughtReminder(thoughtId: string): Promise<void> {
  const next = scheduling.catch(()=>{}).then(async()=>{
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for(const item of existing) if(item.content.data?.treksorDailyThought === true && item.content.data?.thoughtId === thoughtId) await Notifications.cancelScheduledNotificationAsync(item.identifier);
  });
  scheduling=next;return next;
}
// Local reminders cover only content already fetched by the phone. Remote daily
// delivery while the app is closed still needs the server's push scheduler.
export function scheduleTodaysPowerThought(thought: string, thoughtId: string): Promise<void> {
  const next = scheduling.catch(()=>{}).then(async()=>{
    const inbox = useNotificationStore.getState();
    if(!thought.trim() || !thoughtId || !inbox.owner || !inbox.ready || inbox.read[`thought:${thoughtId}`]) return;
    const owner=inbox.owner;
    const permission = await Notifications.getPermissionsAsync();
    if(!permission.granted) return;
    const now = new Date();
    const day = [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
    const marker = `${owner}:${day}:${thoughtId}`;
    const previous = await AsyncStorage.getItem(KEY);
    if(previous === marker) return;
    const target = new Date(now.getFullYear(),now.getMonth(),now.getDate(),HOUR,0,0);
    if(target.getTime() <= now.getTime()) return;
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for(const item of existing) if(item.content.data?.treksorDailyThought === true) await Notifications.cancelScheduledNotificationAsync(item.identifier);
    const latest=useNotificationStore.getState();
    if(latest.owner !== owner || latest.read[`thought:${thoughtId}`]) return;
    await Notifications.scheduleNotificationAsync({
      content:{title:"TREKSOR · POWER THOUGHT",body:thought.trim().slice(0,180),sound:"default",badge:Math.max(1,noticeCount(latest.items)),data:{treksorDailyThought:true,thoughtId,owner,route:"/mental/thoughts"}},
      trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:target},
    });
    await AsyncStorage.setItem(KEY,marker);
  });
  scheduling=next;return next;
}
