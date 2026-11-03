import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import {
  defaultWake,
  nextWakeTime,
  validateWake,
  WakeSettings,
  ScheduledWake,
} from "./model";
interface WakeNative {
  isAvailable(): boolean;
  schedule(id: string, at: number, sound: string): Promise<string>;
  cancel(id: string): Promise<void>;
  scheduledIds(): Promise<string[]>;
  alertingIds(): Promise<string[]>;
  openClock(hour: number, minute: number, sound: string): Promise<string>;
}
const native = requireOptionalNativeModule<WakeNative>("TreksorWake");
const crypto = requireOptionalNativeModule<{ randomUUID: () => string }>(
  "ExpoCrypto",
);
const key = "treksor.wake.device.v1";
export type WakeData = {
  settings: WakeSettings;
  scheduled: ScheduledWake | null;
};
export function wakeCapability() {
  return native?.isAvailable()
    ? Platform.OS === "ios"
      ? "alarmkit"
      : "clock"
    : "reminder";
}
export async function readWake(): Promise<WakeData> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return { settings: { ...defaultWake }, scheduled: null };
  const data = JSON.parse(raw);
  validateWake(data.settings);
  if (data.scheduled) {
    if (
      !["alarmkit", "reminder"].includes(data.scheduled.kind) ||
      typeof data.scheduled.id !== "string" ||
      !Number.isFinite(data.scheduled.at)
    )
      throw Error("Wake settings could not be restored.");
    validateWake(data.scheduled.settings);
  }
  return { settings: data.settings, scheduled: data.scheduled || null };
}
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.catch(() => {}).then(work);
  queue = next;
  return next;
}
async function exists(wake: ScheduledWake) {
  if (wake.kind === "alarmkit") {
    if (!native?.isAvailable())
      throw Error("Update Treksor to manage the saved system alarm.");
    return (await native.scheduledIds()).includes(wake.id.toLowerCase());
  }
  return (await Notifications.getAllScheduledNotificationsAsync()).some(
    (n) => n.identifier === wake.id,
  );
}
async function remove(wake: ScheduledWake) {
  if (wake.kind === "alarmkit") {
    if (await exists(wake)) await native!.cancel(wake.id);
  } else await Notifications.cancelScheduledNotificationAsync(wake.id);
}
/** Reconcile with the OS: alarms stopped on the watch/lock screen must not appear active. */
export function refreshWake() {
  return serial(async () => {
    const data = await readWake();
    if (data.scheduled && !(await exists(data.scheduled))) {
      data.scheduled = null;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    }
    return data;
  });
}
export function saveWakeSettings(settings: WakeSettings) {
  return serial(async () => {
    validateWake(settings);
    const data = await readWake();
    await AsyncStorage.setItem(key, JSON.stringify({ ...data, settings }));
  });
}
export function cancelWake(expectedId?: string) {
  return serial(async () => {
    const data = await readWake();
    if (expectedId && data.scheduled?.id !== expectedId) return;
    if (data.scheduled) await remove(data.scheduled);
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ ...data, scheduled: null }),
    );
  });
}
export function scheduleWake(settings: WakeSettings) {
  return serial(async () => {
    validateWake(settings);
    const old = await readWake(),
      mode = wakeCapability();
    if (mode === "clock") {
      // The Clock confirmation screen owns its alarms. Opening it is not proof of saving.
      await native!.openClock(
        settings.hour,
        settings.minute,
        settings.sound + ".wav",
      );
      await AsyncStorage.setItem(key, JSON.stringify({ ...old, settings }));
      return null;
    }
    const at = nextWakeTime(settings);
    let id =
      crypto?.randomUUID() ||
      `wake-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (mode === "alarmkit")
      await native!.schedule(id, at, settings.sound + ".wav");
    else {
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync(settings.sound, {
          name: "Wake · " + settings.sound,
          importance: Notifications.AndroidImportance.HIGH,
          sound: settings.sound + ".wav",
          audioAttributes: { usage: Notifications.AndroidAudioUsage.ALARM },
          vibrationPattern: [0, 300, 150, 300],
        });
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted)
        throw Error(
          "Allow notifications in device Settings to save a wake reminder.",
        );
      id = await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: "Wake gently",
          body: "Make a little space for yourself today.",
          sound: settings.sound + ".wav",
          data: { kind: "treksor-wake" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(at),
          channelId: settings.sound,
        },
      });
    }
    const scheduled: ScheduledWake = {
      id,
      at,
      kind: mode === "alarmkit" ? "alarmkit" : "reminder",
      settings: { ...settings },
    };
    try {
      // Replace only when the previous alert can be removed. A failed replacement
      // cancels its new candidate; it must not silently leave two wake alarms.
      if (old.scheduled) await remove(old.scheduled);
      await AsyncStorage.setItem(key, JSON.stringify({ settings, scheduled }));
    } catch {
      try {
        await remove(scheduled);
      } catch {
        throw Error(
          "Wake-up could not be saved or rolled back. Check Treksor alarms in device Settings before scheduling again.",
        );
      }
      throw Error(
        "Wake-up was not saved. Reopen this page to check the previous alert before trying again.",
      );
    }
    return scheduled;
  });
}
export async function currentAlert(): Promise<ScheduledWake | null> {
  const { scheduled: wake } = await readWake();
  if (
    !wake ||
    wake.at > Date.now() ||
    Date.now() - wake.at > 10 * 60 * 1000 ||
    wake.kind !== "alarmkit" ||
    !native?.isAvailable()
  )
    return null;
  return (await native.alertingIds()).includes(wake.id.toLowerCase())
    ? wake
    : null;
}
export async function wakeForNotification(
  id: string,
): Promise<ScheduledWake | null> {
  const { scheduled: wake } = await readWake();
  return wake?.kind === "reminder" &&
    wake.id === id &&
    wake.at <= Date.now() &&
    Date.now() - wake.at < 10 * 60 * 1000
    ? wake
    : null;
}
