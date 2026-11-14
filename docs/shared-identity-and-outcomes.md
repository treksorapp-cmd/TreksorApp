# Treksor — Shared identity and outcome records

## What is already available
The mobile app authenticates users against the **same Supabase project** as the existing public web/data layer. It currently uploads a coarse `app_progress` snapshot. These features extend that same auth system; they do not introduce another account.

## Server tables (created, RLS checked)
- `public.treksor_goals`: `user_id = auth.uid()`, an allowed metric, 1–7 target for rolling 7 days, status, timestamps; unique owner+metric.
- `public.treksor_activity_events`: minimal owner/metric/event reference/date/origin, with unique owner+metric+origin-ref for idempotence. No UPDATE privilege for mobile clients.
- `public.treksor_recommendation_feedback`: optional owner-scoped yes/no response for a specific recommendation per day.

No email, journal text, mood, personal priority text, location data, biometric samples or exercise weights are included in these **new** tables. Be aware existing `app_progress` currently has a different upload contract and must be audited separately before claiming all fitness data stays on-device.

## App contract
`lib/cloud-goals.ts` uses the current Supabase Auth session and refresh token and never a service-role key.
`components/GoalProgressCard.tsx` allows:
1. Select Body (workout sessions) or Purpose (days with a saved priority).
2. See genuine logged activity and a bounded, explainable suggested action.
3. Explicitly sync selected goal and session/day timestamps to shared account data.
4. Submit usefulness feedback separately, by choice.

Events are self-recorded in this version: do not call them objectively verified. Watch-origin values are **reserved for a future HealthKit-enabled native build**, and cannot presently be imported from a real Apple Watch.

## Web integration
The web UI can use the **same Supabase Auth user**, then read:
- `GET /rest/v1/treksor_goals?select=...&user_id=eq.<own-auth-uid>`
- `GET /rest/v1/treksor_activity_events?select=...&user_id=eq.<own-auth-uid>`
Do not use `service_role` from frontend JS. Do not reconstruct an identity from email addresses. RLS handles owner checks even if the query is manipulated. All writes are explicitly user-controlled in the current mobile UI.

**Important:** The independent public Treksor website code is not connected by this mobile-only PR. A developer with website source access must bind web Today/Goals/Progress to these tables and then run true mobile↔web account-switch tests.

## Web QA acceptance
1. Login to both apps with the same Supabase account, set Body target in mobile, sync, verify web shows identical target.
2. Update goal in web, reopen mobile and verify fresh server value; deliberately handle concurrent edits (server updated_at check / conflict UI is still required).
3. Complete actual recorded workout, sync, and verify distinct idempotent event appears once on web.
4. Sign out both; second account cannot read or mutate first user's records (test RLS with two real test accounts).
5. Disable network and retry; no unexpected duplicate records, no phantom completion.
6. Explicit user deletion controls and GDPR-style export/privacy work before launch.
7. Health-sensitive data requires explicit per-type consent, privacy disclosures and deletion mechanisms.

## API consistency
The shared metric IDs are `workout_sessions_7d`, `priority_days_7d`, `meditation_sessions_7d`, `journal_days_7d`. Only the first two have a mobile source implementation in this PR. Mind notes remain local, and legacy Balance practices lack reliable timestamps for migration. Do not invent retroactive completion dates.

## Current limitations
- The website UI is not yet wired to these tables.
- No bi-directional conflict resolution or offline cloud queue.
- No HealthKit permissions or watchOS executable.
- No actual production beta cohort, funnel analytics, or subscription validation.
