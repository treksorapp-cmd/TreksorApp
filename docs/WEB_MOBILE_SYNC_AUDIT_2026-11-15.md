# Treksor — Mobile/Web/Admin Synchronization Audit
Date: 2026-11-15
Scope: `TreksorApp` integration branch, `web/treksor-community/dist`, `TreksorAdmin`, Railway production metadata and Supabase production *read-only* inspection.

## Verdict
**NOT fully synchronized; NOT functionally equivalent; NOT independently verified on two live clients.** Do not advertise full web/iPhone/watch parity. Shared infrastructure exists, but app and website have materially different sets of features. The improvements in PR #15 are **source changes only** pending deployment and authenticated E2E.

## Sources of truth and deployment boundaries
- User authentication: one Supabase Auth project `niakfwerfqmrmhuypkpd` (mobile API client and website Supabase JS config point to it). User identity: `auth.users.id`.
- User content: mobile loads editorial articles and power thoughts from public content feed on Railway. Railway currently runs `treksor-admin` (successful deployment on 2026-11-03; deployment metadata commit `925aeafc` on `backend/supabase-foundation`), which administers the Supabase articles/thoughts. Editor/admin role is distinct from member permissions.
- Public website source: `web/treksor-community/dist/` in `TreksorApp`, not `TreksorAdmin`. Hosted URL stated in the README: `https://treksor-community.oceanicman.chatgpt.site`. Host could not be reached from available verification tools; there is **no verified deployment pipeline** from this Git branch to the hosted site.
- Mobile development install: the user's Treksor DEV uses Expo development build; no native rebuild, Metro update, local Git command or iPhone installation was initiated by this audit. Current local Git state had previously been reported as `MERGING`.
- `TreksorApp` and `TreksorAdmin` GitHub repos were public when inspected. Owner must review intended visibility before launch.

## Parity matrix — verified from code/schema

| Area | iPhone app | User website | Shared persistence | Status |
| --- | --- | --- | --- | --- |
| Account | Supabase Auth email/password; legacy social paths remain | Same Supabase Auth email/password | `auth.users` | **Shared identity implementation**; real login handoff not E2E tested; social-login parity absent |
| Name/avatar | Auth metadata; mobile profile update | Auth metadata; website form | Supabase Auth and avatar storage | **Partly shared**, requires two-device verification and cache invalidation tests |
| Articles / thoughts | Railway public editorial feed | Pillar landing content, no equivalent full article reader | Supabase articles/power_thoughts via Railway admin feed for app | **No full user-facing parity** |
| Workout/sets | Detailed local plan, sets, check-ins | Read-only per-device progress snapshots | `app_progress`, keyed user and device | **One-way summary**; editing on web and cross-device restore absent |
| Today completed day | Local private check-ins + owner-scoped date events | New `#/today` and explicit date-only event recording in PR #15 | `treksor_sync_events` (RLS and idempotent unique key) | **Two-way date marker in source, not E2E verified or live deployed** |
| Grocery list | New Body > Nutrition > Shopping list in PR #15 | New `#/groceries` in PR #15 | Existing `nutrition_groceries` (owner RLS, authenticated SELECT/INSERT/UPDATE/DELETE) | **Two-way CRUD in source, not E2E verified or live deployed** |
| Quick Notes | Tasks, notes and opt-in local notifications | No corresponding notes page | Local AsyncStorage only | **Not synchronized; private text requires explicit cloud-consent strategy** |
| Weekly habits | Flexible weekly minutes/sessions | No corresponding planning UI | Local AsyncStorage only | **Not synchronized** |
| Mentor | AI chat modes and native interface | Mentor directory, invitations, member messages | Different services/tables | **Not equivalent; do not conflate human mentors with AI Mentor** |
| Community | City events, locations and connections | Groups, 1:1, mentors and messages | Some Supabase tables shared; different views | **Partial**, event and invitation actions differ |
| Progress | Local full details, date summaries and trackers | App snapshots readable per device, no writeback | `app_progress`, `treksor_sync_events` | **Read-only website mirror, not bidirectional progress editor** |
| Watch/Health | iOS native modules and companion interfaces | No equivalent watch controls | Partial bridge/contracts | **In development; not fully validated** |
| Nutrition / energy | Mobile nutrition and early energy model | Shopping list newly staged; no calories/tracking parity | Some nutrition tables | **Partial**, no truthful live energy balance yet |

## Verified database controls
Read-only Supabase inspection found RLS enabled on all listed public tables, including `app_progress`, `nutrition_groceries`, `treksor_sync_events`. Owner predicates rely on `auth.uid()`. `treksor_sync_events` has `unique(user_id,kind,event_key)`, a date-only privacy check for `today_completed`, `source=web` allowed and an automatic UUID. `nutrition_groceries` has **no server UUID default**, so PR #15 generates UUIDs in both clients. There were no production SQL writes or schema changes in this audit.

Supabase security advisor still reports `auth_leaked_password_protection` disabled: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Improvements created (draft PR #15)
- `web/treksor-community/dist/today.js`: owner-only completed-day listing; explicit idempotent `today_completed` upsert; no journal/mood contents.
- iPhone Today: read the shared date and show a separate completion status without forging the three private daily actions.
- iPhone Nutrition and website: shared grocery CRUD with owner-scoped API and refresh after writes.
- Website navigation: Today and grocery list, terminology `Your journey`, shared midnight Architect palette.
- `web/treksor-community/tests/parity.cjs`: mocked identity isolation, source event payload, escaped user-generated grocery text, add/check/delete flows; mobile TypeScript and existing release tests remain in CI.
- Draft PR only; no Railway deployment, Supabase mutation, website publishing or iPhone update.

## Remaining release blockers (priority order)
1. Identify and control website hosting/deployment; prove the served HTML/JS asset versions match the GitHub commit. A passing GitHub test does not update `chatgpt.site`.
2. Complete two-device signed-in E2E: account A and account B, app→web and web→app Today and groceries; verify rows changed exactly once and remain invisible to B. Verify deletion and app refresh/reopen.
3. Resolve `app_progress` per-device snapshots into canonical per-user activity, stable record IDs, explicit conflict rules and safe deletion; no overwriting data from another device.
4. Design owner-only canonical data + consent for private Quick Notes, scheduled reminders and weekly habits. Notes require opt-in upload and careful local push notification semantics.
5. Bring AI Mentor / human Mentor terminology, Community events, workouts and nutrition editors into an explicit platform feature matrix. Native-only watch, HealthKit and offline workflows should be labelled as native-only rather than claiming identical physical capabilities.
6. Test article/thought publishing admin→Railway public feed→iPhone; website content listings need equivalent publisher feeds if full reader parity is required.
7. UI comparison on real iPhone and mobile/desktop browsers, loading/empty/error states, accessibility, session switching, dark palette and navigation.
8. Address Supabase leaked-password warning, verify app release protection, review public repository visibility, perform security/RLS adversarial tests.
9. Before shipping: production user-data backup/rollback plan and release checklist. Do not merge PR #15 directly into old `develop`, or update the Windows repo while in `MERGING`.

## E2E minimum acceptance protocol
- Sign in to one test account on both clients, confirm same `auth.users.id` and profile.
- App: create grocery item, refresh web: item appears once; website: check item, refresh app: checked; website: undo; app: delete; web: absent.
- Web: explicitly mark a Today completion. Refresh iPhone Today: banner indicates shared completion, but local private daily actions remain unchanged. App records a separate day's completion; website shows its date once.
- Account switch to user B on either platform: A's notes, groceries, progress and dates are not shown; B cannot mutate A's rows. No credentials are logged.
- Disconnect network, verify clear failure without falsely showing save/sync success; retry after restoring connection.
- Test older installed Treksor DEV against the new hosted site; do not claim full parity until app code and website are both updated.
