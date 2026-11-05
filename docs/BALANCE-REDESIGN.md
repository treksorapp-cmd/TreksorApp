# Balance — November 2026

## Evidence and design choices
Reviewed Pura Mente's public App Store Spain and Google Play reviews and official routine guidance. Qualitative signals: approachable beginner guidance, daily consistency, relaxing/sleep content, unobtrusive reminders and accessible navigation. Complaints include surprise paywalls and sign-in problems. This is not a representative survey or a measured ranking of most searched features; public reviews do not provide search-volume analytics.

- https://apps.apple.com/es/app/pura-mente-meditacion-y-sue%C3%B1o/id1448598865?platform=iphone&see-all=reviews
- https://play.google.com/store/apps/details?hl=es&id=app.puramente.app
- https://intercom.help/puramente/es/articles/10570443-como-ver-y-editar-mi-rutina-diaria

Treksor implementation is original: no Pura Mente scripts, recordings, images or branding were copied.

## Implemented
- Balance tabs Today, Meditate, Breathe, Sleep, My practice. Architect colors and type, primary next practice, bookmarks, editable intention, rolling-week goal of 2/3/5/7 practice days and preferred time (not an automatic notification).
- Six original text-guided practices lasting 3/5/10 minutes, including a breathing visual and bedtime wind-down. Timer pauses when the app backgrounds; only completed saved sessions add timed minutes. No sounds library or sleep stories have been fabricated.
- Private account-scoped practice history, day streak with yesterday grace, rolling-week days, session milestones. Duplicate session IDs are idempotent. Self-reported guided completions do not invent listening minutes. Morning ratings stay on device and are excluded from cloud payloads.
- Practice session summaries sync through existing private app_progress snapshots and appear in web Progress per device. Goals/favorites remain editable in the app; this does not merge progress across phones.
- Native HealthKit sleep read permission is separate from workout permission. Apple/Garmin samples only, 30 completed date labels; awake/in-bed excluded, overlapping asleep intervals merged. Noon-to-noon sleep-day totals may include naps. Sleep-day labels use import phone timezone, retain their date on the web.
- Sleep import is previewed in memory then explicitly saved into private sleep_snapshots. Only date, asleep minutes and source labels are uploaded; no raw stages, GPS, HR or morning ratings. Web and app use identical sleep metrics. Each account sees one latest import, sources never added together.
- Week comparison requires at least three recorded sleep-days in each 7-day period. Missing nights are missing, never zero. Duration increase is not labelled improved sleep quality or attributed to meditation. Device estimates are not a diagnosis.
- Owner delete from either app or website. Revoke future HealthKit access in iPhone settings separately; deleted source records reconcile on the next explicit saved import.

## Delivery limits
Native Swift/HealthKit is not yet compiled or exercised on a physical iPhone. A new signed iOS build is required; Expo CLI is not authenticated. Android Health Connect, direct Garmin cloud OAuth and Strava are not active. Browser visual QA is unavailable in this environment; route rendering and metrics are covered by automated tests. Existing uploaded intermediate/advanced media are addressed separately; beginner source audio has not been identified. No claim of real-device audio playback is made.

## References for sleep
https://support.apple.com/guide/watch/track-your-sleep-crpxel1lvun9/watchos
https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis
