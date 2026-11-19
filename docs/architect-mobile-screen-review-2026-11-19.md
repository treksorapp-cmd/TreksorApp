# Treksor · The Architect — Mobile screen review
**Review date:** 19 November 2026  
**Base:** `feature/v12-community-weekly-question-20261119`  
**Working review:** `fix/v12-architect-global-page-rhythm-20261119`

## Scope and continuity
Reviewed the **66 non-layout TSX screen modules** under `app/` and their shared page/navigation components. Changes are narrowly scoped to mobile visual hierarchy: no storage schema, accounts, workouts, videos, external services, notifications, publishing, website or native Watch build changes.

## Canonical design system
The source of truth is `theme/architect.ts`:
- Background **#05080D**; panel **#0B1017**; raised panel **#121922**; accent **#D7B877**.
- Page title: **34 / 42**, weight **600**, letter spacing **−0.6**.
- Section title: **22 / 29**, weight **600**, letter spacing **−0.2**.
- Card title: **18 / 25**, weight **600**.
- Body: **15 / 23**; caption: **12 / 18**.
- Eyebrow: **11 / 16**, weight **600**, letter spacing **1.4**, gold.
- Page top after AppFrame: **8** points; compact top-level titles: **4**; recommended content gutter **22**; section rhythm **24**.

The Architect here is the **established typographic hierarchy and style**, not a new downloaded font. Large timer numbers, editorial photography and hero imagery may use justified overrides.

## Issues found and addressed
1. **Progress / Community** applied independent top offsets despite the fixed navigation; both now use the same compact top rhythm.
2. **Today** stacked scroll padding with an additional 26-point JourneyCard section margin, making the header visually drift down. Both now use compact spacing.
3. **Nested Body, Mind, Balance, Purpose, Profile, Progress, Article screens** repeated `insets.top + 12` (and 14) manually. Authenticated screens now use `layout.pageTop`. Auth flows retain their own full safe area; success and media views retain purposeful presentation.
4. **Home, Guide, Gym, Articles, Nutrition, Power Thoughts and Journal** had individually copied 31–38-point headings. Their page and section titles now reuse `type.page` and `type.section` where appropriate.
5. **Notes, Shopping List, Community events** displayed a second back control even when the persistent global route bar was active. These actions remain available when the bar is absent.
6. **Old blue/navy-trial surfaces** survived in some Home, Gym, Nutrition, Power Thoughts and Moments tiles. Replaced with neutral midnight surfaces or restrained gold details.
7. **Global route bar** reduced its vertical padding and standardised icon dimensions; the pillar dropdown still measures and anchors below the entire safe-area header.

## Screen groups inspected
- Auth & onboarding: landing, sign-in, sign-up, OTP and password reset.
- Tabs: Home, Today/Daily Work, Guide, Community, Progress and article tabs.
- Body: home, walk records, Nutrition and groceries, Gym plans, sessions, library and exercises.
- Mind: reflections, edit/view flow, Power Thoughts, personal journal and moments.
- Balance: meditations, breathwork, sleep and waking.
- Purpose: vision board, reflections and goals routes.
- Profile: profile/edit, public moments, premium research.
- Progress: journey, connections and daily check-in.
- Community: city discovery and experiences.
- Shared components: AppFrame, BodyPageHeading, Header, PillarMenuScreen, JourneyCard.

## Regression protection / acceptance
- `npm run typecheck`
- `npm run test:integrity` (including `tests/architect-screen-rhythm.cjs` and `tests/architect-global-installer.cjs`)
- Keep the previously implemented fixed-route picker, horizontal pillar carousel, Guide mark, weekly Community question and Daily Work/Progress synchronization.
- On-device iPhone validation still required for dynamic text sizes, camera notch/safe-area, title wrapping, modal overlays and final perceived spacing. Do not present CI/static review as a verified visual screenshot.
- The Windows installer is `patches/apply-architect-global-windows.cjs`; it preflights conflicts and preserves local modifications with backups. Do not switch branches or replace the user's local checkout.
