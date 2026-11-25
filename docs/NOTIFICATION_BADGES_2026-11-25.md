# Notification and unread badge correction — 2026-11-25

Status: prepared code; not installed in Windows/iPhone, not merged or deployed.
Base inspected: backup/treksor-base-estable-v1.0-20261121 at 48e7635, the newest remote mobile snapshot found. The phone may contain later local changes (including audio work). Do not replace that folder or check out this whole branch over it. The guarded installer applies a diff only if all contexts match, with a backup.

## Confirmed causes

- Local daily-thought notifications omitted badge and content ID; the legacy server sender also omitted badge.
- Notification taps were logged but did not navigate. Cold starts were not handled by the general listener.
- Thought read receipts were compared with today's date, making already-read thoughts unread after midnight. Concurrent storage writes could lose receipts.
- The thoughts list had no read action or unread indicator. Article counts were not refreshed with the feed and could leave old category copies behind.
- No shared durable notification inbox or icon badge reconciliation existed. Pillar discovery acknowledgements were separate from content reads.

## Changes

- Per-account local inbox, stable content IDs, deduplication, durable read receipts, serialized writes and stale-account guards.
- Global header notification control and red unread indicators; Home counts unread editorial content, Progress counts received Quick Notes reminders. Article/thought lists and pillar discoveries share read receipts. Reading does not mean visiting a list or opening Home.
- Incoming/warm/cold notification navigation waits for authentication and the root navigator. Opening content retains unread state until explicitly marked read. Opening a reminder acknowledges the notification without completing the task.
- Refresh on foreground, incoming notifications and periodic foreground polling. iOS badge reconciles with the inbox; unknown/denied badge permission is surfaced in the inbox, with Settings access.
- Current local daily thought includes badge, stable thought ID and account. Reading cancels a pending notification. Quick Notes includes stable note ID, owner, route, sound and badge; completion/deletion acknowledges its reminder.
- Wake stays under WakeRuntime; no fake missed-alarm unread records or Community/Guide counts are invented.
- Full article refresh removes withdrawn articles from category caches. Thought writes are flushed before account backup.
- Removed a duplicate headerShown property already present in the baseline chat layout so TypeScript can validate the change. Final header behavior remains false.

## Validation

Passed: TypeScript; new notification model/store/runtime tests (including cold tap, navigation readiness, background/resume, duplicates, read during refresh, account switch, late hydration, logout, midnight, rapid writes, payload fields and cancellation); content sync; progress/account restoration; Wake lifecycle and service; daily work; unified progress; dashboard; journey; audio; video; clock; ecosystem; balance; mentor; discovery; training; Watch; UI contracts; connected journey; retention; goals; web parity; git diff checks.

The full release:check stops in tests/guide-home-style.cjs because it expects `!isHome && <TouchableOpacity`, which is absent from the unmodified base AppFrame as well. Separate checks also reproduced pre-existing mismatches in architect-screen-rhythm (old pageTop token), home-integrated-hero (old hero structure), and guide-keyboard (installer snapshot differs from the saved Guide). The same failures were checked against the unmodified base. These are not passed release gates. Do not publish based solely on this branch.

## Explicit limits / release gates

- No native iPhone delivery, App Store build, production deployment or Windows source state has been verified here.
- The legacy backend patch supplies badge=1 as a pending indicator when closed; it cannot know the exact per-device unread total without a server read ledger. The app reconciles the exact known total on launch/resume. Local schedules also contain a snapshot of the count at scheduling time, not a future authoritative server count.
- The legacy backend uses Mongo/JWT auth while the inspected app signs in through Supabase. Its token registration endpoint and actual live sender must be verified before relying on remote delivery. Dashboard editorial feed and legacy Mongo publications are separate sources. This patch does not migrate authentication or publication infrastructure.
- Local daily scheduling only covers an already-fetched thought before the phone's 9 AM; it is not a reliable server-backed daily push service for unopened days.
- iOS permissions/Focus settings remain controlled by the user. Android icon badge appearance depends on the launcher; in-app unread indicators do not depend on OS badges.
- Cross-device read synchronization is not added. Notifications and reminder contents remain local to the account on that phone.
- Keep the production listing com.treksor.prod / App Store ID 6755161893; do not submit com.treksor.dev as its replacement.

## Windows installer

`scripts/apply-notification-badges.cjs --check` validates the complete diff without changing app files. `--apply` first creates an adjacent timestamp/random backup folder and manifest, then applies atomically. Tested refusal of conflicting local edits without mutation, clean dry run, backed-up application and repeat/idempotency. It never changes branch, merges, installs dependencies or deploys.

## iPhone acceptance

Use the exact verified Windows checkout. Test one new thought with the app open, backgrounded and terminated; confirm banner, icon badge, header/Home/Mind indicator and tap destination. Mark it read and restart, including after midnight. Repeat with an article and a Quick Notes reminder. Confirm reminder acknowledgement does not complete a task, reading one article does not acknowledge another, offline reads survive reopening, account switches do not expose another inbox, and Wake keeps its existing alarm flow. Check the fixed header at narrow width/text enlargement. Finish server token/delivery verification and the existing release gates before App Store submission.
