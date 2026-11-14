import type { EventEvidence } from "@/lib/goal-evidence";

export type WatchWorkoutSummary = {
  workoutId: string;         // HealthKit HKWorkout UUID, not a user-defined ID
  startedAt: string;
  endedAt: string;
  activityType: "strength" | "walking" | "running" | "hiking" | "other";
};

/**
 * Boundary contract only. NOT an implementation of HealthKit permission,
 * WatchConnectivity, or actual Apple Watch syncing.
 * A future native iOS module must supply authorised, trusted HKWorkout records.
 */
export function mapAuthorisedWatchWorkout(input: WatchWorkoutSummary, now = new Date()):
  Omit<EventEvidence, "source"> & { source: "watch" } | null {
  const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  if (!uuid.test(input.workoutId)) return null;
  const start = Date.parse(input.startedAt), end = Date.parse(input.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const duration = end - start;
  if (duration < 60_000 || duration > 12 * 60 * 60 * 1000) return null;
  if (end > now.getTime() + 5 * 60_000) return null;
  if (start < 0) return null;
  return {
    metric_key: "workout_sessions_7d",
    origin_ref: "healthkit:" + input.workoutId.toLowerCase(),
    occurred_at: new Date(end).toISOString(),
    source: "watch",
  };
}

/**
 * Future deduplication must also reconcile an app-logged session and a HealthKit
 * record for the same workout. Their IDs are different; timestamps alone are not
 * sufficient proof of equality. The backend must not double-count overlapping
 * sessions before watch data is included in outcomes.
 */
export function overlapsWorkout(a: Pick<WatchWorkoutSummary, "startedAt"|"endedAt">,
  b: Pick<WatchWorkoutSummary, "startedAt"|"endedAt">): boolean {
  const as = Date.parse(a.startedAt), ae = Date.parse(a.endedAt);
  const bs = Date.parse(b.startedAt), be = Date.parse(b.endedAt);
  return [as, ae, bs, be].every(Number.isFinite) && Math.max(as, bs) < Math.min(ae, be);
}
