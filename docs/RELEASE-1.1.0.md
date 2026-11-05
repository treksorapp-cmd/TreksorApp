# Treksor 1.1.0 — growth, discovery and playback

Progress opens on real activity across the selected 7 or 30 days. A private daily check-in records mood, focus and energy on an explicit 1–5 scale. Missing days remain missing. Journal mood is used only when no daily check-in exists for that date. Training volume excludes timed sets and external-load-free bodyweight sets. Detailed pillar summaries and custom trackers remain available below the main view. Travel mode prioritizes moments and reflection.

Life moments stores selected JPEG photos in the app document directory and indexes them by local calendar day and account. Check-in ratings use SecureStore; check-in date indexes and photo metadata use account-scoped AsyncStorage. These local records do not sync across devices yet. Public sharing requires an explicit confirmation for each moment and a discoverable profile. Only the selected photo, caption and date are uploaded. The private journey-moments bucket issues 15-minute signed URLs subject to RLS. Previously issued links can remain valid until they expire after unpublishing. Community viewers can report a moment or block its author; reports use the existing web_reports moderation queue. No private journal text or mood scores enter the publication payload.

The `profile_moments` migration is deployed to treksor-production. The source snapshot and transaction-only RLS regression are in web/treksor-community. RLS tests verified owner access, outsider read visibility, forbidden outsider deletion, and private-profile exclusion without persisting fixtures.

Exercise demonstrations start muted and loop when their screen is focused and the app is active. Live workouts activate the current exercise as the user scrolls, preload the next, reserve stable card space, and release distant video sources. Pause and sound controls remain available. Body prefetches a shared catalogue containing batch-signed video URLs. Plan, session, library and detail screens reuse that catalogue; valid prepared links need no extra playback-link request. Signed URLs are deduplicated and reused for at most ten minutes, bounded by their actual expiry, with native MP4 caching and a five-second forward buffer. The public endpoint reduces UUID playback to one catalogue lookup and caches the 15-minute signed result for five minutes. Actual first-frame time depends on network, file encoding and device; it has not been benchmarked on an iPhone in this environment.

Pillar discoveries use article cover images or bundled pillar imagery, meaningful titles, direct content links and real unseen counts. A single subtle entrance animation respects reduced motion. Four Home badges share a throttled fetch. Article details now load their catalogue when reached directly from a fresh discovery card.

## Health connection status

No HealthKit or Health Connect data is read by this binary. The UI states this explicitly. Native permissions, platform modules, source attribution, deduplication, revocation and on-device testing remain required before exposing steps, sleep or health-imported workouts. Garmin integration requires its own approved data access. No proprietary readiness or recovery scores are simulated.

## Release preparation and remaining gates

- Production stays on bundle com.treksor.prod, Expo project 67c51458-b4bc-49a9-a9a9-c9117a576b2d, App Store Connect app 6755161893.
- Development stays separate on com.treksor.dev; an inherited TREKSOR_IPHONE_DEV flag cannot turn a production EAS profile into the development app.
- EAS production uses store distribution, remote build-number auto-increment and the documented Xcode 26.2 image. SDK 53 native compatibility with that image must be confirmed by the cloud build; JavaScript exports do not prove this.
- This workspace has no authenticated Expo CLI session. App Store Connect displayed the sign-in screen. No production binary has been built or submitted here.
- Run the production build and test the exact binary in TestFlight, including iPhone playback, background/resume, slow network, large text, check-ins, photo permission denial and profile privacy.
- Complete the App Store privacy disclosures, current screenshots and review metadata; select the exact reviewed build and submit to Apple. TestFlight upload alone is not a public App Store release.

```sh
npx eas-cli@26.0.0 login --device
npm run release:ios
```

`release:ios` checks the source, creates the production build and uploads it to App Store Connect using the existing submit profile. It does not bypass Apple's review or publish a store listing automatically.


## Visual and connection sweep — 29 October 2026

The workout timer stays outside the scrolling exercise list. Overall session time keeps running; the independent rest clock lights up while recovering and dims to a stopped 00:00 while training. Rest is based on a persisted deadline, including app background/foreground and session resume. Controls add 15 seconds or end rest to start a set. Finishing the same session twice cannot duplicate its check-in.

Nutrition home, both category lists and all six product details use framed imagery below their headings. The original portrait assets include long dark footers; the shared artwork component frames the actual product area. Supplement copy no longer overlays its product photo. All headings use the shared navigation and title hierarchy.

The tab bar now participates in layout, preventing it from covering the last content or the Mentor composer. Detail headings expose a back action where navigation history exists. Photo permissions are requested only when selecting a profile picture.

Web Progress uses period-filtered training volume with timed sets excluded, and deduplicates sets and training check-ins. Custom tracker titles cannot become pillar scores. Community and profile pages link to authenticated Life moments, which use the same shared records as the app. Private check-in ratings remain local. The source navigation audit checked 46 literal app navigation destinations across 55 screen modules, with no unresolved routes. Browser preview infrastructure was unavailable locally; signed-out web routes are checked after deployment. No physical-device visual or authenticated app-to-web session was available for verification.
