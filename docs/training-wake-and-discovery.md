# Training, wake-up and guided discovery

This change restores the approved first-days guide and adds library-backed Gym programming and Balance → Wake gently. The previous local hash `030b69343a225028160f2ce5222dae2345471690` was not present in the current checkout or remote; the guide is recovered in a new commit, not represented as that original object.

## Training

The 16 published exercise names were checked against their media labels. `lib/exercise-identities.ts` preserves their known video identities even after a display-name edit. New media still needs a reviewed name/movement mapping before entering automatic plans.

Plans for 2–5 days use movement patterns instead of slicing an arbitrary exercise list. They distinguish biceps from triceps, avoid duplicate leg-curl variants in one session, adapt set/rep/rest defaults to experience and goal, and retain manual selections. Session prescriptions are saved with the active workout so catalogue refreshes cannot change them midway. The existing sticky exercise/rest clock remains in place.

The uploaded library does **not** support a complete lower-body plan: verified squat, hip-hinge and calf movements are missing. This limitation appears in My plan. “Dumbbell Rear Lunge Stretch” remains available for manual selection but is excluded from automatic strength plans until its demonstration is reviewed. No substitute MuscleWiki media was copied.

Reference patterns: [MuscleWiki generator](https://musclewiki.com/generator), [beginner upper/lower routine](https://musclewiki.com/routine/upper-lower-body-beginner-routine). Treksor coaching text and programming are its own implementation, not a licensed copy or an affiliation.

## Wake gently

15 distinct recordings from [Kenney Music Jingles](https://kenney.nl/assets/music-jingles), released under CC0, are bundled for offline use. Original licence and file provenance/hashes are in `assets/audio/wake`. The OpenGameArt publisher mirror supplied the same bank. Adaptations use reduced gain, a low-pass filter, spaced repeats and fades; all files are 16-second mono PCM16 WAVs. Sound preferences are subjective; this feature does not promise improved mood or sleep outcomes.

Gold, warm and cool particle themes; optional slow animation; optional screen brightness. Reduced Motion is respected. Preview audio stops and brightness restores on dismissal/background. Live OS alarms keep their own sound; the in-app presentation does not start a duplicate audio player.

| Device/build | Behaviour | Limit |
| --- | --- | --- |
| iOS 26+, native AlarmKit module | User-authorized system alarm, next occurrence, bundled sound | Requires a newly compiled, signed app with Xcode 26 SDK and physical-device verification |
| Paired Apple Watch | Apple can forward the iPhone system alarm | No independent Treksor watchOS app or custom watch brightness/particle control |
| Android with native module | Opens device Clock with time, label and requested sound | User confirms in Clock; Treksor does not claim it saved an alarm. Some Clock apps ignore custom sounds |
| Older iOS / module unavailable | Clearly labelled local notification reminder | Silent/Focus/battery policies can suppress it; not a dependable alarm substitute |

The next wake-up is a fixed instant in the time zone used when scheduling; travelling across time zones requires setting it again. Device alarms are device-wide and remain until cancelled, including after sign-out. They carry no private journal/health data. No recurring alarms or snooze are claimed in this version. Animation/glow require Treksor in the foreground and do not control locked screens or third-party watches.

Permission refusal never saves a fictitious alarm. Replacement requests are serialized; a failure attempts rollback. Stopping a stale overlay cannot cancel a newer alarm. OS state is reconciled when reopening the configuration screen, including an alarm stopped on Apple Watch. Settings edits do not silently mutate an already scheduled alarm.

Native references: [Apple AlarmKit session](https://developer.apple.com/videos/play/wwdc2025/230/), [AlarmConfiguration](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration), [Android AlarmClock](https://developer.android.com/reference/android/provider/AlarmClock).

## First-days guide

Eight real destinations: check-in, Body, Mind journal, Balance, Purpose, Mentor, Community and Progress. Home offers gentle suggestions over the first 14 days, at most once per local date, with at least 20 hours between prompts. Exploring areas brings later suggestions forward. Features remain available from day one. The guide is accessible from Home and Profile, with an opt-out for automatic tips.

Preferences and explored-area history are per account on this device. Prompting waits for verified authentication and avoids workouts, keyboard input, subscriptions, background state and the wake overlay. Failed preference writes pause prompting. The exploration count measures opened areas, never health or achievement.

## Validation and release boundary

- TypeScript, existing release checks, UI hierarchy contracts and new discovery/training/wake tests.
- Tests cover permissions, time zones/DST, replacement, rollback, stale-stop races, serialized requests, renamed exercise uploads, session prescriptions and all 15 sound formats/hashes.
- The Wake screen rendered through React Native Web with mocked native services. A visual screenshot could not be captured because the browser binary download failed. This does not validate native layout, audio, AlarmKit, Clock apps or smartwatch forwarding.
- Metro iOS/Android exports validate JavaScript/assets, not Swift/Kotlin compilation or signed installation.

Before a public release, build `iphone-preview` (Xcode 26.2 configured), install on a real iPhone and verify: allowed/denied alarm permission, each selected sound with locked/unlocked screens, paired Watch forwarding and stop, silent/Focus mode, background transitions, brightness restoration, system-stopped alarm reconciliation, time-zone travel, Android Clock handoff and sound support. The native Swift/Kotlin code has not been compiled on this Linux workspace. Expo/EAS account access and Apple signing are required to produce an installable build. A GitHub push alone does not update an installed app or publish to the App Store.
