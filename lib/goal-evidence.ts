import { dayKey, recentDays } from "@/lib/progress-metrics";

export type GoalMetric = "workout_sessions_7d" | "priority_days_7d";
export type EventEvidence = {
  metric_key: GoalMetric;
  origin_ref: string;
  source: "mobile";
  occurred_at: string;
};
type GymSet = { id: string; kg: number; reps: number; recordedAt: string };

function isValidStamp(s: unknown): s is string {
  return typeof s === "string" && Number.isFinite(Date.parse(s));
}
export function workoutEvidence(checkIns: Record<string, string[]>, now = new Date()): EventEvidence[] {
  const days = new Set(recentDays(7, now));
  const stamps = new Set(
    Object.values(checkIns || {}).flat()
      .filter(isValidStamp)
      .filter(stamp => days.has(dayKey(new Date(stamp))))
  );
  return [...stamps].sort().map(stamp => ({
    metric_key: "workout_sessions_7d", origin_ref: "gym-checkin:" + stamp,
    source: "mobile", occurred_at: stamp,
  }));
}
export function priorityEvidence(priorityDays: string[], now = new Date()): EventEvidence[] {
  const days = new Set(recentDays(7, now));
  return [...new Set(priorityDays.filter(d => days.has(d)))].sort().map(day => ({
    metric_key: "priority_days_7d", origin_ref: "today-priority:" + day,
    source: "mobile", occurred_at: new Date(day + "T12:00:00").toISOString(),
  }));
}
export function volumeSummary(gymSets: GymSet[], now = new Date()): { sets: number; volumeKg: number } {
  const days = new Set(recentDays(7, now));
  const valid = (gymSets || []).filter(set =>
    isValidStamp(set.recordedAt) &&
    days.has(dayKey(new Date(set.recordedAt))) &&
    Number.isFinite(set.kg) && set.kg > 0 &&
    Number.isFinite(set.reps) && set.reps > 0
  );
  return { sets: valid.length, volumeKg: Math.round(valid.reduce((total, set) => total + set.kg * set.reps, 0)) };
}
export type SuggestedAction = {
  key: "workout_next_session_v1" | "purpose_daily_priority_v1" | "goal_on_track_v1";
  title: string; explanation: string; destination: "body" | "purpose";
};
export function recommendGoalAction(input: {
  metric: GoalMetric; target: number; observed: number; lastRecordedDay?: string | null; now?: Date;
}): SuggestedAction {
  const now = input.now ?? new Date();
  const count = Math.max(0, Math.floor(input.observed));
  const target = Math.max(1, Math.min(7, Math.floor(input.target)));
  if (count >= target) return {
    key: "goal_on_track_v1", title: "You've reached your weekly target",
    explanation: "The app has " + count + " recorded day(s)/session(s) in the last seven days. You can recover or choose a new focus — no need to chase a longer streak.",
    destination: input.metric === "workout_sessions_7d" ? "body" : "purpose",
  };
  if (input.metric === "workout_sessions_7d") {
    return {
      key: "workout_next_session_v1", title: "Plan your next workout",
      explanation: count + " of " + target +
        " recorded sessions in the last seven days. Check your training plan, and adapt it to your recovery and schedule.",
      destination: "body",
    };
  }
  return {
    key: "purpose_daily_priority_v1", title: "Set a meaningful priority",
    explanation: count + " of " + target +
      " days with a saved priority in the last seven days. Choose one useful action for today.",
    destination: "purpose",
  };
}
export function localToday(now = new Date()) { return dayKey(now); }
