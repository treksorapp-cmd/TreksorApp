import * as SecureStore from "expo-secure-store";
import { dayKey, recentDays } from "@/lib/progress-metrics";

// One private, device-only record for each account and local calendar day.
export function todayRecordKey(userId: string, date: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return "treksor.today.v1." + safeId + "." + date;
}

export async function getPriorityDays(userId: string, now = new Date()): Promise<string[]> {
  if (!userId) return [];
  const days = recentDays(7, now);
  const contents = await Promise.all(days.map((date) => SecureStore.getItemAsync(todayRecordKey(userId, date))));
  return days.filter((_date, index) => {
    const raw = contents[index];
    if (!raw) return false;
    try {
      const record: unknown = JSON.parse(raw);
      if (!record || typeof record !== "object") return false;
      return typeof (record as { priority?: unknown }).priority === "string"
        && !!(record as { priority: string }).priority.trim();
    } catch {
      return false;
    }
  });
}

export function todayKey(now = new Date()): string {
  return dayKey(now);
}
