# Treksor user website

Live: https://treksor-community.oceanicman.chatgpt.site

English, public website with account-protected profile, progress and Community. The Architect palette and Manrope typography are retained. Static HTML/CSS/JavaScript in `dist/`; Supabase JS 2.102.0 is vendored. Only the publishable key is included.

## Routes

- `#/`: public website.
- `#/ecosystem`: Body, Mind, Balance and Purpose.
- `#/community`: public group discovery, category/city filters and memberships.
- `#/community/one-to-one`: opt-in member discovery and accepted private invitations.
- `#/community/mentors`: approved mentors and applications.
- `#/space`: invitations, connections, groups and visibility preferences.
- `#/profile`: shared app account name/photo/email and community preferences.
- `#/progress`: private app snapshots, pillar scores, training, learning, custom trackers and vision completion.
- `#/group/:id`, `#/connection/:id`, `#/admin`: group discussions, private conversations and admin review.

Previous Spanish hash routes remain aliases. Spanish database enum values remain unchanged and have English display labels.

## Shared app account and progress

The mobile app and web use the same Supabase project `niakfwerfqmrmhuypkpd`. Profile name/photo use Auth `user_metadata.name` and `avatar_url`; community nicknames are a separate opt-in profile. Email/password authentication is shared. Existing legacy social sign-in has not been migrated; social-only users need the app's password setup before using this website.

`app-progress-schema.sql` was applied as `treksor_private_app_progress`. `app_progress` has one snapshot per user/device, owner-only RLS, no anonymous grants, immutable identity columns, and a server timestamp. Clients PATCH only the payload, then INSERT when no snapshot exists. The website never writes training progress or merges devices; this prevents one device overwriting another. There is no automatic restore of cloud progress into a new device in this version.

Mobile integration lives in `hooks/useProgressSync.ts`, `lib/local-progress.ts`, `lib/progress-payload.ts`, `store/progress-sync-store.ts`, and `components/ProgressSyncStatus.tsx` in TreksorApp. It syncs on startup, changes, foreground, every minute while active and manual retry. Network failures retain local data. Local account caches prevent progress crossing accounts and preserve histories across logout. First upgrade adopts legacy local progress for the signed-in account.

Progress contains training preferences, logged sets/check-ins, exercise and article completion, meditations, custom trackers, thought-reading dates and vision completion count. Journal text, mood-journal records and vision answers stay on the device. Pillar percentages follow the app's calculation; missing scores display a dash. Date charts show actual check-ins, not manufactured activity. Website refreshes progress every minute while visible and offers manual refresh.

### Activate on the existing development phone

Update `design/premium-showcase-2026` and restart the existing Expo development build:

```sh
git pull origin design/premium-showcase-2026
TREKSOR_IPHONE_DEV=1 npx expo start --dev-client --lan --clear
```

Open the app with the same account as the website, then Tracking → Sync now. Historical phone-only progress cannot appear on the website before this first sync. No installed App Store binary was replaced by this source change.

## Community and permissions

Previous migrations: `treksor_web_community` (`schema.sql`), then `treksor_web_profile_visibility` (`fix-profile-policy.sql`). The restricted `treksor_private.is_web_contact` helper avoids recursive profile policies. Only recipients accept invitations. Messages require an accepted connection and no block. Mentors cannot approve themselves. Group discussions require membership/ownership. Reports are limited to reporter/admin. Progress is never exposed through community profiles.

Conversations refresh manually; no email/push delivery is triggered. Mentorship scheduling and fees are agreed directly, without automatic bookings or billing. Small-group format is a preference, not a capacity limit. No fictitious members or progress are seeded. Account deletion/export, subscription management and native Community screens remain outside this website update.

## Validation

- `node tests/portal.cjs`: signed-out gate, first-sync state, snapshot rendering, missing-data labels, escaping and enum compatibility.
- `node --check` for all four JavaScript files.
- Mobile `node tests/progress-sync.cjs`: private-text exclusion, deduplication, legacy adoption, logout preservation and account isolation/restoration.
- Expo iOS production bundle export completed successfully. Full TypeScript check has existing repository errors; the change added no new diagnostic categories against the unchanged branch baseline.
- Server read-only verification confirmed all four owner policies, RLS, anonymous denial, payload-only update privileges and server timestamp trigger.
- `test-app-progress.sql` contains rollback-only adversarial checks. Live execution was blocked by a connector `Invalid or expired requestState` error; do not treat this test as passed.
- No real user's credentials or phone were available for an end-to-end authenticated sync test. The first real device sync remains to be verified after installing the updated app code.

The GitHub mirror lives at `web/treksor-community/` on `design/premium-showcase-2026`. Run `python fetch-assets.py` there to restore the photograph (the hosted Site already contains it). No Sites hosting identity is copied into the mobile repository.

Forest photograph: Jeffrey Eisen, Unsplash, https://unsplash.com/es/fotos/gente-caminando-junto-a-las-colinas-1YAAaJIqzPg . Atmospheric imagery, not a Treksor event. Manrope is served through Google Fonts with a local sans-serif fallback. Supabase licence: `dist/assets/SUPABASE-LICENSE.txt`.
