# TREKSOR — Apple Watch integration contract (preparation only)
**Status:** planned; no HealthKit capability, WatchConnectivity, native watchOS target or production watch reads are enabled by this change.

## Product behavior
- The iPhone app and the website share the **same Supabase Auth account**. A watch app is an iPhone companion, not a new account or new password.
- v1 watch value: an optional **completed-workout summary** that can contribute to a Body goal after user consent.
- Priorities, journal text, chat messages, GPS trails, location history, and raw heart-rate are **not** synced by default.
- All personal fitness data remains on device unless the user explicitly enables account synchronization of workout dates.
- Do not count both an iPhone-recorded session and a mirrored watch workout as two sessions.

## Permissions and native implementation
1. Build a proper watchOS Swift/SwiftUI target in Xcode / EAS native workflow. Expo JS alone does not add a working Apple Watch app.
2. Request only **HKWorkout read** permission at the point of need; do not request heart-rate, location, or activity rings unless a user-facing feature actually requires them. Add HealthKit entitlements and usage descriptions only with the native implementation.
3. Use HealthKit anchored queries for new/removed workout records, and retain cursor locally and per Apple Health source.
4. When implementing watch-origin workout recording, use HKWorkoutSession / HKLiveWorkoutBuilder; mirror sessions between Apple Watch and iPhone. Never silently run background workouts.
5. Validate HKWorkout UUID, duration, dates. `lib/watch-workout-contract.ts` maps *authorised summaries* to the shared cloud contract; it does not fetch anything.
6. Deduplicate real sessions across watch and iPhone via source identifiers and overlap reconciliation. Overlaps require user review when ambiguous, because timestamps alone are not a proof.
7. Treat `source=watch` as an origin **label** only, never server-verified attestation: an authenticated client can forge the field.
8. Handle revoked HealthKit permissions, deleted workouts, unpaired watches, offline periods and account switching.
9. Test on physical iPhone and Apple Watch before claiming availability.

## Shared data boundary
`treksor_activity_events`: `user_id`, `metric_key=workout_sessions_7d`, `origin_ref=healthkit:<UUID>`, `source=watch`, `occurred_at`.
No raw heart-rate, workout routes or raw health samples are persisted by the proposed schema.

## Acceptance gates
- Consent request displayed only when user chooses Apple Watch integration.
- Phone-only experience remains complete with no watch paired.
- Revoking Apple Health permission stops further reads without data loss.
- One real workout = at most one counted Body session regardless of imports or retries.
- Explicit user controls for deleting synced summaries and disconnecting the source.
- Provide a clear privacy notice and updated App Store privacy disclosures.
- Independent iOS/watchOS physical-device QA with account switches and network failures.

## References
- https://developer.apple.com/documentation/healthkit/building-a-multidevice-workout-app
- https://developer.apple.com/documentation/healthkit/running-workout-sessions
- https://developer.apple.com/videos/play/wwdc2025/322/
