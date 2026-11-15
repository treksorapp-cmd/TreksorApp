# Treksor — Weekly Practice and Wearable Energy Roadmap

## Implemented on integration branch
- Today includes personal weekly practices, not fixed weekdays.
- Reading presets and custom practices: 15/30/60 minutes, 1–7 sessions/week.
- Completion is one session per habit per local calendar day; users can undo it.
- Monday–Sunday week, distinct-day counts, no penalty for rest days.
- Account-scoped, offline-first AsyncStorage on this device; not yet synchronized across web/watch.
- The four pillars remain Body, Mind, Balance, Purpose. Today is a cross-pillar tool.
- A pure energy-balance estimator is available but **not connected to a live health feed or shown as measured data**.

## Apple Health / Apple Watch — current state
The native TreksorHealth module currently supports permissioned workouts and sleep previews. Apple Watch target is included in the development build, but Apple Health daily energy categories and dietary intake are **not implemented**. Do not label this as a live calorie balance feature.
Next: request only the user's explicit read permission for activeEnergyBurned, basalEnergyBurned, dietaryEnergyConsumed; aggregate by local day, show data source, last-sync timestamp and missing fields. Never combine duplicate Garmin and Apple energy records.

## Garmin — current state
No commercial Garmin Connect OAuth connection or approved Garmin business credentials have been verified in this repo. Garmin Connect Developer Program offers a business Health API; approval/contract and OAuth integration are required before advertising a direct Garmin connection. Personal API keys are for personal use, not for a multi-user commercial integration. Garmin-origin workouts appearing in Apple Health are not proof of a direct Garmin connection.
Do not collect Garmin passwords or personal API keys in Treksor.

## Energy logic and user trust
Estimated daily balance = dietary energy - (resting energy + active energy).
Negative means estimated deficit; positive means estimated surplus.
If any component is missing, display **Insufficient data** rather than inventing a number.
Show estimates, not clinical precision; avoid making calorie goals or weight-loss judgments automatically. Consider day completeness, stale data, source priority, permissions and timezone boundaries.

## Production acceptance
- Habit settings and completion sync securely across app/web/watch only after user-scoped RLS and conflict-resolution tests.
- Ensure duplicate imports never count as additional completed sessions.
- Test timezone changes, DST, Monday rollover, same-day undo, archived habits, offline storage failures, sign-out/sign-in and multi-account isolation.
- Add permissions, privacy disclosure and native iOS rebuild before enabling energy reads.
- No production migration or EAS deployment in this branch.
