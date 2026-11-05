export type WakeTheme = "gold" | "warm" | "cool";
export type WakeSettings = {
  hour: number;
  minute: number;
  sound: string;
  theme: WakeTheme;
  motion: boolean;
  brightness: boolean;
};
export type ScheduledWake = {
  id: string;
  at: number;
  kind: "alarmkit" | "reminder";
  settings: WakeSettings;
};
export const defaultWake: WakeSettings = {
  hour: 7,
  minute: 0,
  sound: "wake_01",
  theme: "gold",
  motion: true,
  brightness: false,
};
export function validateWake(value: WakeSettings) {
  if (
    !value ||
    !Number.isInteger(value.hour) ||
    value.hour < 0 ||
    value.hour > 23 ||
    !Number.isInteger(value.minute) ||
    value.minute < 0 ||
    value.minute > 59 ||
    !/^wake_(0[1-9]|1[0-5])$/.test(value.sound) ||
    !["gold", "warm", "cool"].includes(value.theme) ||
    typeof value.motion !== "boolean" ||
    typeof value.brightness !== "boolean"
  )
    throw Error("Choose a valid time and sound.");
  return value;
}
export function nextWakeTime(value: WakeSettings, now = new Date()) {
  validateWake(value);
  const next = new Date(now);
  next.setHours(value.hour, value.minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}
export const wakeThemes = {
  gold: { color: "#D7B877", halo: "#B99141" },
  warm: { color: "#F4B18B", halo: "#A45E45" },
  cool: { color: "#B7DDF0", halo: "#45759C" },
} as const;
