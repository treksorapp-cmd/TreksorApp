# Connected life — November 2026

## Implemented
- Read-only local Expo/HealthKit module: completed workouts from Apple and Garmin source apps, last 30 local calendar days. Native module is linked for Apple release builds; existing clients without the module show an update-required state instead of crashing.
- Explicit two-stage permission and upload: review locally in memory, then save only on confirmation. Read permissions are deliberately never inferred from a successful permission dialog or an empty query.
- Owner-only `health_snapshots`: one atomic snapshot per Treksor account, automatic server timestamp; no Community or Mentor reader. A new save replaces the previous import, including removed records. Another phone replaces this snapshot rather than adding duplicate snapshots.
- Private app/web journal, per-source 7/30 day view, duration, sessions, active days, prior-week comparison. Exact record IDs deduplicated. Sources are selected, never summed; gym sessions stay separate. 30-day view has no comparison against unavailable previous 30 days.
- Source labels, last saved time, missing-data states, refresh on explicit import, delete import from either client. No health data in logs, analytics, AI prompts or community.
- Workout imports contain no steps, sleep, HR, readiness, GPS or route data. Balance now offers a separate explicit opt-in sleep-duration import; see BALANCE-REDESIGN.md. No automatic health read/upload, watch control or watchOS companion binary.

## Activation still required
1. Compile/sign a new iOS build (`iphone-preview` or production) with HealthKit capability and test on a real iPhone. Existing installed Dev app cannot gain this native module through Metro or OTA. Expo authentication is still required; this task does not create a signed binary.
2. Device QA: authorize/deny, empty history, Apple Watch and Garmin records, source/device attribution, save on the same account, account switching during reads/uploads, network failure, web refresh/delete, removal in Health then reimport, 30-day boundaries and travel timezones. Browser visual QA was unavailable in this environment.
3. Apple Health originals remain untouched. To revoke access use iOS Health Data Access & Devices; delete the saved Treksor import separately. New imports reconcile source deletion only when explicitly saved, not in background.
4. Garmin direct cloud integration requires registration/access through Garmin Connect Developer Program and actual supplied OAuth/API docs/credentials. No credentials are configured. Current implemented path is supported Garmin Connect sharing to Apple Health; not all Garmin data is transferred.
5. Strava is NOT connected. Current Strava policy (effective June 1, 2026) sections 5.3/5.4 restrict AI use and combining/analytics; section 6 limits caching. Register a Treksor API app, confirm the permitted product scope with Strava, and implement a separate private, short-lived activity display with revoke/deletion handling. Do not merge Strava into these health totals or pass it to Mentor. Direct and indirect Strava imports are excluded.
6. Android can display an owner's saved account import; Health Connect native ingestion is not implemented.

## References
- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- https://docs.expo.dev/modules/get-started/
- https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA
- https://developer.garmin.com/gc-developer-program/overview/
- https://developers.strava.com/docs/authentication/
- https://www.strava.com/legal/api_policy

## Verification
Run `npm run release:check`, `npm run test:ui`, and Apple autolinking resolution. Native Swift needs an actual Xcode/EAS build. Website `dist/activity.js` is generated from `lib/ecosystem/activity.ts`; preserve parity when updating it. Schema and rolled-back RLS fixtures are in `web/treksor-community/`.
