# Treksor — cross-device parity contract

## Product rule
One Supabase Auth identity (auth.users.id) across mobile, web and watch-linked companion. Admin access is an additional role checked in admin_members, not a second account. Same four user-facing pillars, in this order: Body (dumbbell), Mind (brain), Balance (leaf), Purpose (compass). Today, Mentor, Progress and Community are cross-pillar tools; Workout and Nutrition live under Body. Design: The Architect, background #02050C, surface #111820, elevated #19222C, gold #D7B877, ivory #F5F4F1, muted #A5AAAF.

## Current verified boundaries
- Mobile authenticates with Supabase Auth and writes allowlisted workout/tracking/Today summary data to public.app_progress, scoped by user_id + device_id with RLS.
- Mobile Progress now reads Today completed dates across app_progress rows for the signed-in user, merging with local dates without importing mood/focus/energy. **This is display-level convergence, not a complete bidirectional data model.**
- The watch companion currently supports only the read-only `progress` request. It explicitly rejects writes. No watch-originated activity input has been implemented; native watchOS UI and bridge changes are needed.
- The public website source is not among the accessible GitHub repositories. No web write path or design parity can be verified yet.
- App progress is stored per device; a full bidirectional workout edit requires stable record IDs, conflict resolution and a canonical per-user event model. Do not overwrite another device's payload with a local snapshot.
- Admin Supabase-backed branch is `backend/supabase-foundation`; admin membership is role-specific. Do not give all users admin permissions.

## Required shared activity event schema (design contract, not deployed)
- id: UUID (generated once on originating device, reused for retries)
- user_id: Supabase auth.users.id (server-enforced ownership)
- pillar: Body | Mind | Balance | Purpose
- kind: workout_set | workout_session | today_checkin | balance_session | goal_progress | other supported event
- occurred_at: UTC timestamp; source: ios | android | web | watch
- revision: monotonic per-record revision, updated_at UTC, deleted_at nullable
- public payload: minimal structured values necessary for progress; no journal text, vision answers, passwords or auth tokens
- idempotent insert/update with stable IDs, conflict handling, offline queue and replay

## Acceptance tests — mandatory before launch
1. Create one account in app; sign into website with same Supabase Auth user ID; profile name and avatar match in both directions.
2. Log a workout on app; confirm same set IDs, weights, reps and timestamp on web; edit on web; app refresh shows the edit exactly once.
3. Complete Today on web; app displays completion without requiring a local private mood record; app-originated completion appears on web.
4. Record a supported activity on Apple Watch; iPhone bridge persists it with stable ID and auth owner; web shows it; retry never duplicates it. Revoke watch sharing and verify writes are rejected.
5. Log out, log into another account on same phone; previous user's data never appears. Confirm RLS blocks cross-user reads and writes.
6. Offline writes are queued and replayed safely; simultaneous edits have a documented conflict rule; deletions propagate.
7. Mentor receives only consented current summary values from canonical store; no hallucinated or stale activity counts.
8. Compare Body/Mind/Balance/Purpose and Today/Mentor/Progress/Community labels, icons, navigation, empty/loading/error states across iOS, web and watchOS.
9. Run typecheck, regression tests, real-device watch tests, authenticated browser E2E and security advisors before deployment.

## Status
NOT launch-ready. Today cross-device read implementation is unmerged; web source and watch write capability are missing. Do not claim cross-platform bidirectional sync or full parity until the acceptance tests above pass.
