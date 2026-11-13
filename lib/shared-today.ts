import { useAuthStore } from "@/store/auth-store";

const ENDPOINT = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/app_progress";
const KEY = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Read only completion dates from every device belonging to the current authenticated user.
 * Do not import mood/focus/energy or overwrite this device's private check-in records.
 */
export async function getSharedTodayDates(owner: string): Promise<string[]> {
  const session = useAuthStore.getState();
  if (!owner || !session.isAuthenticated || session.user.id !== owner || !session.token) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(ENDPOINT + "?select=payload&user_id=eq." + encodeURIComponent(owner), {
      headers: { apikey: KEY, Authorization: "Bearer " + session.token }, signal: controller.signal,
    });
    if (!response.ok) throw new Error("Shared progress unavailable");
    const rows: {payload?: {today?: {completedDays?: unknown}}}[] = await response.json();
    const current = useAuthStore.getState();
    if (!current.isAuthenticated || current.user.id !== owner) return [];
    return [...new Set(rows.flatMap(row => Array.isArray(row.payload?.today?.completedDays)
      ? row.payload.today.completedDays.filter(validDate) : []))].sort();
  } finally { clearTimeout(timeout); }
}
