# Treksor — 14-day retention and willingness-to-pay pilot

## Objective
Treksor currently has **no external users**. We must validate consistent usefulness before applying subscription restrictions.

## Product hypothesis
A user who can choose a meaningful Today priority, complete one genuinely helpful action, and review an honest 7-day history will find a reason to return. A subset may then be interested in paying for *additional verified ongoing value*.

## What this branch actually delivers
- A collapsed **Your Week** review on Today, expanded by user choice.
- Only account-scoped saved Today priorities and private journal dates count towards weekly activity. Unrecorded days are neutral; no punitive streaks or health scores.
- One chosen near-term focus (Body, Mind, Balance, Purpose), stored per-user on device, with an actionable route.
- A voluntary research card on Today asking whether a monthly plan is interesting, a hypothetical USD range, and the *possible future* premium capability that matters most. Responses persist locally per account and are shared **only by explicit OS Share action**.
- The old automatic expired-trial paywall is disabled in this **draft** branch; existing paid-plan management is left accessible.
- Paywall copy avoids unverified fixed trial periods and outdated future-availability claims.
- No checkout, preorder, billing or server-side event collection is added to the research component.

## Before beta — functional QA
- `npm run typecheck`, `npm run test:retention`, `npm run test:connected`, `npm run test:progress`, `npm run test:ui`, `npm run test:integrity`.
- iOS and Android: account switch, logout/login, empty state, fully offline restart, timezone/date rollover, text accessibility sizes, keyboard/touch/scroll, secure-store read failures.
- Confirm Today, Body, Mind, Balance, Purpose and Mentor routes; confirm the weekly total is based on *saved* activity, not opening a screen.
- Confirm revenue flow separately in the store sandboxes: actual configured offers/trials, displayed localized prices, restores, cancellations and expiry/entitlements. Do not rely on marketing strings or backend-plan flags alone.
- Audit older global persisted workout/meditation stores for cross-account data isolation before using them for account-level retention metrics.

## Recruitment
Invite ~20–30 consenting beta participants fitting Treksor's intended audience. Avoid claiming this is a representative market sample. Offer ordinary free beta access; do not pressure anyone to buy or solicit ratings.

## Cohort definitions (requires transparent, consented analytics or direct beta follow-up)
- Eligible: invited participant who successfully created an account and reached Today.
- Activated: saved one Today priority **and** completed a real recorded action in a pillar within 48 hours.
- D1 / D7: fraction of activated users who return and save another meaningful action on day 1 / day 7 after activation. Use fixed local-calendar windows, document exact denominators.
- Weekly active: users with at least one qualifying saved action in the last 7 days, deduplicated by person.
- Trial-to-paid and refund rates: do not calculate until legitimate, functional store subscriptions exist.
- Interest signals: count shares/responses voluntarily received, labelled as hypothetical. They are **not** payments or purchase intent proven by a transaction.

## Provisional learning goals — not guaranteed results
- 60% of eligible testers save a Today priority.
- 35% of eligible testers record at least one meaningful action in a pillar in 48 hours.
- 25%+ D7 meaningful-action retention among activated testers.
- At least 10 qualitative interviews about why users did or did not return.
- Collect a minimum of 10 optional responses to the premium concept survey before choosing price packaging.

Sample sizes are too small to establish reliable monetization forecasts. Do not present these as achieved metrics.

## Candidate free vs paid design — NOT IMPLEMENTED as entitlements
Free core: daily priority, a useful set of entry-level practices, basic progress and accessible community discovery.
Possible Plus: deeper personalised multi-pillar planning, validated progress insights, additional Mentor capacity and useful cross-device continuity **only after these capabilities exist and are tested**.
Don't lock existing content based solely on the above candidate list.

## Privacy and security
- Private Today priority text, journal content and mood are stored locally; research sharing includes no identifiers or private writings.
- Consent to share premium interest cannot be inferred from merely opening the card or saving locally.
- No user telemetry or email harvesting is introduced by this branch.
- Do not use raw local device IDs as pseudo-user identifiers in public analytics.
- Apple's and Google's current purchase/restore, disclosure and subscription terms must be met before commercial release.

## Go/no-go decision after 14 days
If people do not return: improve the core loop and practical actions before monetisation.
If users return but do not see a Plus benefit: keep a useful free experience and interview about unmet needs.
Only after sustained use + verified premium benefit: design an honest, testable store paywall with entitlements and a clear restore path.
