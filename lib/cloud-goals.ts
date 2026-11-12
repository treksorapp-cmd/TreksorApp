import { useAuthStore } from "@/store/auth-store";
import { supabaseAuth } from "@/api/supabase-auth";
import type { GoalMetric, EventEvidence, SuggestedAction } from "@/lib/goal-evidence";

const BASE = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/";
const API_KEY = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";

export type CloudGoal = {
  id: string; user_id: string; metric_key: GoalMetric; target_count: number;
  status: "active" | "paused"; updated_at: string;
};
export type CloudEvent = { id: string; user_id: string; metric_key: GoalMetric; origin_ref: string; occurred_at: string; source: string };
type Feedback = { recommendation_key: SuggestedAction["key"]; metric_key: GoalMetric; helpful: boolean; recorded_on: string };

function isCurrentUser(userId: string): boolean {
  const a = useAuthStore.getState();
  return !!a.isAuthenticated && a.user.id === userId && !!a.token;
}
/**
 * All calls use the authenticated person's JWT and owner-scoped RLS.
 * No service role, email address, journal text or health samples.
 * A current-account guard prevents completing a request after logout/account switch.
 */
async function rest<T>(userId: string, path: string, method: "GET"|"POST", body?: unknown, retry = true, prefer?: string): Promise<T> {
  if (!isCurrentUser(userId)) throw new Error("Sign in to sync your goal.");
  const state = useAuthStore.getState();
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 12000);
  let result: Response;
  try {
    result = await fetch(BASE + path, {
      method, signal: abort.signal,
      headers: {
        apikey: API_KEY,
        Authorization: "Bearer " + state.token,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } finally { clearTimeout(timeout); }
  if (!isCurrentUser(userId)) throw new Error("Your account changed. No goal was saved locally.");
  if (result.status === 401 && retry && state.refreshToken) {
    const session = await supabaseAuth.refresh(state.refreshToken);
    if (!isCurrentUser(userId) || !session.access_token) throw new Error("Please sign in again.");
    useAuthStore.setState({
      token: session.access_token, refreshToken: session.refresh_token || state.refreshToken,
    });
    return rest<T>(userId, path, method, body, false, prefer);
  }
  if (!result.ok) throw new Error("Could not sync. Your local activity is unchanged.");
  const text = await result.text();
  if (!isCurrentUser(userId)) throw new Error("Your account changed. Please refresh.");
  return (text ? JSON.parse(text) : null) as T;
}
export async function readCloudGoals(userId: string): Promise<CloudGoal[]> {
  const query = "treksor_goals?user_id=eq." + encodeURIComponent(userId) +
    "&select=id,user_id,metric_key,target_count,status,updated_at&order=updated_at.desc";
  return rest<CloudGoal[]>(userId, query, "GET");
}
export async function readCloudEvents(userId: string, metric: GoalMetric, since: string): Promise<CloudEvent[]> {
  const query = "treksor_activity_events?user_id=eq." + encodeURIComponent(userId) +
    "&metric_key=eq." + encodeURIComponent(metric) +
    "&occurred_at=gte." + encodeURIComponent(since) +
    "&select=id,user_id,metric_key,origin_ref,occurred_at,source&order=occurred_at.desc";
  return rest<CloudEvent[]>(userId, query, "GET");
}
export async function syncCloudGoal(userId: string, metric: GoalMetric, target: number) {
  if (!Number.isInteger(target) || target < 1 || target > 7) throw new Error("Choose a target between 1 and 7.");
  await rest<CloudGoal[]>(userId,
    "treksor_goals?on_conflict=user_id,metric_key", "POST",
    [{ user_id: userId, metric_key: metric, target_count: target, status: "active", updated_at: new Date().toISOString() }],
    true, "resolution=merge-duplicates,return=representation"
  );
}
export async function syncRecordedEvents(userId: string, events: EventEvidence[]) {
  // Cross-device writes are idempotent by (user_id, metric_key, origin_ref).
  // Only a single selected metric is synced on each explicit action.
  if (!events.length) return;
  if (events.length > 30) throw new Error("Too many events to sync at once.");
  const body = events.map(event => ({
    user_id: userId,
    metric_key: event.metric_key,
    origin_ref: event.origin_ref,
    occurred_at: event.occurred_at,
    source: event.source,
  }));
  await rest<null>(userId,
    "treksor_activity_events?on_conflict=user_id,metric_key,origin_ref",
    "POST", body, true, "resolution=ignore-duplicates,return=minimal");
}
export async function sendRecommendationFeedback(userId: string, feedback: Feedback): Promise<void> {
  await rest<null>(userId,
    "treksor_recommendation_feedback?on_conflict=user_id,recommendation_key,recorded_on",
    "POST", [{ user_id: userId, ...feedback }], true, "resolution=merge-duplicates,return=minimal");
}
