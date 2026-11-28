# Progress — minimal overview

The main view has three elements: active days over the selected period, a single
Log activity button, and the three most recent activities. The default is seven
days. View details is the only gateway to the expanded view. Health import status
is a quiet footer with the actual import date and a connection link.

Notes and daily direction move into Plan & habits. Period selection, individual
workout counts, source selection and explanations move into Activity details.
The duplicate Explore your progress link is removed. Guide response counts and
article-count cards are removed from Progress; their original app destinations
remain available. Private check-ins, charts, trackers, calendar corrections,
weekly habits and goals remain available through the three detail tabs.

The shared Architect palette, fixed navigation, existing type sizes and control
heights remain in place. The main figure stays 54/66, its denominator 23, page
headings 34/42, section headings 18/25, body labels 16/24 and metadata 12/19.
Visual simplification comes from removing duplicate blocks and borders, not
shrinking the interface. Gold is reserved for emphasis and actions. The summary
uses one main number, plain activity rows and minimum 44-point controls. Loading,
failed reads and absent imports remain distinct without permanent explanatory
paragraphs on the main screen. Only three recent items render by default.

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
remain pending. No iOS build, App Store release or automatic update of a local
Windows Expo checkout has been performed.

## Apply to the active Windows checkout

Fetch feature/progress-clarity-20261128 and pipe its
scripts/apply-progress-clarity.cjs into node with --apply from the current
TreksorDevCompleto checkout. No manual file download is required. The installer
supports both the stable base and the earlier Progress redesign. It checks every
patch hunk before writing, saves a backup and validates the resulting checkout.
It preserves the current branch and all stored user records, and refuses
conflicting changes. Repeat runs are safe. Validation failures restore the
previous files.

After successful installation, restart the current Expo session. On the iPhone,
verify the single active-days summary, Log activity, three recent records, and
one View details link. Verify recording/deletion, all three detail tabs, Notes,
7/30-day selection, source selection and returning from Connections. An app/watch
overlap must contribute one active day, with source counts kept separate in
details. Also check empty imports, offline refresh, larger text, account changes
and deletion of an imported snapshot.
