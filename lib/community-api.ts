import { useAuthStore } from "@/store/auth-store";
const BASE = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/";
const KEY = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
export type CommunityEvent = {
  id: string; title: string; description: string; category: string; city: string;
  starts_at: string; capacity: number; status: string; organizer_name: string;
};
export type Registration = { event_id: string };
export type ExperienceFeedback = {
  event_id: string; connected_with_someone: boolean; would_attend_again: boolean;
};
function accountValid(id: string) {
  const s = useAuthStore.getState();
  return !!s.isAuthenticated && s.user.id === id && !!s.token;
}
async function request<T>(path: string, method: "GET"|"POST"|"DELETE", body?: unknown, requireLogin = true, prefer = "return=minimal"): Promise<T> {
  const auth = useAuthStore.getState();
  const uid = auth.user?.id;
  if (requireLogin && (!uid || !accountValid(uid))) throw new Error("Sign in to take part.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      method,
      signal: controller.signal,
      headers: {
        apikey: KEY,
        ...(auth.token && auth.isAuthenticated ? { Authorization: "Bearer " + auth.token } : {}),
        "Content-Type": "application/json",
        Prefer: method === "POST" ? prefer : "return=minimal",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } finally { clearTimeout(timer); }
  if (requireLogin && (!uid || !accountValid(uid))) throw new Error("Account changed. Try again.");
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
    throw new Error("Unable to complete the request. Please try again.");
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
const FIELDS = "id,title,description,category,city,starts_at,capacity,status,organizer_name";
export async function upcomingEvents(): Promise<CommunityEvent[]> {
  const now = new Date().toISOString();
  return request<CommunityEvent[]>(
    "treksor_community_discovery_v1?select=" + FIELDS + "&status=eq.published&starts_at=gt." +
    encodeURIComponent(now) + "&order=starts_at.asc&limit=10",
    "GET", undefined, false
  );
}
export async function myRegistrations(userId: string): Promise<Registration[]> {
  return request<Registration[]>(
    "community_registrations?user_id=eq." + encodeURIComponent(userId) + "&select=event_id",
    "GET"
  );
}
export async function myPastEvents(): Promise<CommunityEvent[]> {
  // RLS exposes past events only to admins and their own registrants.
  const now = new Date().toISOString();
  return request<CommunityEvent[]>(
    "treksor_community_discovery_v1?select=" + FIELDS + "&starts_at=lt." +
    encodeURIComponent(now) + "&order=starts_at.desc&limit=30",
    "GET"
  );
}
export async function joinEvent(userId: string, eventId: string): Promise<void> {
  await request<null>("community_registrations",
    "POST", { user_id: userId, event_id: eventId }, true, "resolution=ignore-duplicates,return=minimal");
}
export async function leaveEvent(userId: string, eventId: string): Promise<void> {
  await request<null>("community_registrations?user_id=eq." + encodeURIComponent(userId) +
    "&event_id=eq." + encodeURIComponent(eventId),"DELETE");
}
export async function submitExperience(userId: string, response: ExperienceFeedback): Promise<void> {
  await request<null>("treksor_event_experience_feedback?on_conflict=event_id,user_id","POST",
    [{ user_id: userId, ...response }], true, "resolution=merge-duplicates,return=minimal");
}
