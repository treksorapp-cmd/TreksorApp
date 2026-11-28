# Progress — concise overview

The default Progress view contains one 7/30-day summary, an activity recorder,
Quick Notes, daily direction and three recent entries. Details replace the
overview instead of expanding another dashboard beneath it. Activity, Wellbeing,
and Plan & habits preserve the existing pillar metrics, check-ins, charts,
trackers, calendar corrections, daily plan, weekly habits and goals.

The shared Architect palette and fixed navigation remain in place. The summary
supports narrow screens, larger text, minimum 44-point controls and readable
labels. Loading, missing imports, failed reads and a genuinely empty import are
different states.

## Data and watch behavior

- All app activity still uses buildProgressOverview and the existing stores.
  Sets recorded by the Treksor watch companion feed that same workout store.
- useProgressHealth reads the account's existing, explicitly saved
  health_snapshots import. It does not request HealthKit permissions, read the
  watch live, upload health data, or grant access to Guide or Community.
- Active days are the union of dated app actions and workouts from one selected
  imported source. A day counts once across app and watch.
- Treksor sessions and imported workouts are shown separately. They are never
  summed into a combined session count: overlap alone cannot prove that two
  recordings represent the same workout.
- Repeated HealthKit UUIDs are normalized by the existing snapshot API. When
  multiple recording sources exist, the user selects one. Opening Connections
  carries that source and the current period into the workout history.
- Same-day gym sets are grouped into one training row in the compact timeline;
  the original set records remain available in workout progress.
- The import timestamp stays visible. Returning from Connections, foregrounding
  the app, or pulling to refresh reloads the saved account snapshot. Refresh
  failures retain only the same account's last successful data and show an error.
  Deleted imports disappear after a successful refresh. Late responses cannot
  replace a newer request or expose another account.
- Native Apple Health import still requires the existing compatible iPhone build
  and explicit review/save in Connections. Direct Garmin cloud, Strava, live heart
  rate and background health import are not implemented by this change.

## Validation

Passed: mobile TypeScript; Progress clarity calculations, UI handlers and async
account isolation; dashboard; unified Progress and installer regression tests;
progress/account synchronization; Apple Health; watch companion, workout and gym;
Daily Work; journey; connected journey; goals; UI contracts.

The managed browser preview relay was unavailable. React Native Web render
checks pass, but browser layout inspection and physical iPhone/Apple Watch tests
remain pending. GitHub publication was blocked by automatic approval review. No iOS build, App Store release or automatic update of a local
Windows Expo checkout has been performed.

## Apply to the active Windows checkout

Download Treksor-Progress-Update.cjs and run it with Node and --apply from
C:/Users/xcite/TreksorDevCompleto. The standalone installer contains the reviewed
patch; it does not fetch or publish any repository branch.
The installer checks the repository and every patch hunk, saves a backup, and
validates the resulting local checkout. It does not switch branches, reset local
work, touch stored user records, or overwrite conflicting changes. A local
smartwatch change that overlaps this patch must be reconciled before installing.

Restart the existing Treksor Dev Expo session after a successful installation.
In the iPhone, verify the subtitle “Your effort, made clear.”, 7D/30D selection,
activity creation/deletion, Notes, all three detail tabs, return from Connections,
and the selected watch source. Compare a workout recorded on both phone and watch:
one active day, separate source counts. Also check no import, empty import,
revoked Health permissions, offline refresh, larger system text, account changes,
and deletion of an imported snapshot.
