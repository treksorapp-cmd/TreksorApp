import { useAuthStore } from "@/store/auth-store";

const ENDPOINT = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/app_progress";
const EVENTS = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/treksor_sync_events";
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
    const headers = { apikey: KEY, Authorization: "Bearer " + session.token };
    const load = async (url: string) => {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) throw new Error("Shared progress unavailable");
      return response.json();
    };
    const results = await Promise.allSettled([
      load(ENDPOINT + "?select=payload&user_id=eq." + encodeURIComponent(owner)),
      load(EVENTS + "?select=event_key&user_id=eq." + encodeURIComponent(owner) + "&kind=eq.today_completed"),
    ]);
    if (results.every(result => result.status === "rejected")) throw new Error("Shared progress unavailable");
    const current = useAuthStore.getState();
    if (!current.isAuthenticated || current.user.id !== owner) return [];
    const legacy = results[0].status === "fulfilled" && Array.isArray(results[0].value)
      ? results[0].value.flatMap((row: {payload?: {today?: {completedDays?: unknown}}}) =>
        Array.isArray(row.payload?.today?.completedDays) ? row.payload.today.completedDays.filter(validDate) : []) : [];
    const events = results[1].status === "fulfilled" && Array.isArray(results[1].value)
      ? results[1].value.map((row: {event_key?: unknown}) => row.event_key).filter(validDate) : [];
    return [...new Set<string>([...legacy, ...events])].sort();
  } finally { clearTimeout(timeout); }
}
