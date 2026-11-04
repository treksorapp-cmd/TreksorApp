# Treksor — launch readiness checklist

This document is an acceptance gate, not a claim that the checks have passed. Run it against a signed preview build **before** approving promotional screenshots or a store submission.

## Visual and copy
- [ ] iPhone SE/compact iPhone, large iPhone, Android compact/large and iPad: no clipped text, overlapping headers, distorted imagery, or oversized buttons.
- [ ] Navigation: Home, Chat, Progress and Articles use clear, consistent icons and selected states.
- [ ] Dark background, gold accents and native system typography are consistent across all onboarding, cards, forms, profile, articles and subscription flows.
- [ ] Large accessibility text, screen reader labels, contrast, keyboard navigation and reduced-motion settings tested.
- [ ] Purpose appears as **in development**. No expired launch date, inaccurate feature availability, invented ritual totals or stock screenshots pretending to be user activity.
- [ ] Screenshots and ad claims describe **only implemented** features. Get rights/consent for all images, music and endorsements.

## Accounts and content
- [ ] Sign-up, verification, email/password reset, Apple/Google sign-in and sign-out checked on both platforms.
- [ ] Account deletion is clear, reversible only before final confirmation, and actually deletes/schedules deletion in the backend as represented.
- [ ] Onboarding and category routes work; empty states and loading errors are useful.
- [ ] Chat works with an empty conversation, long responses, poor network and keyboard visible.
- [ ] Journaling, workout, article and activity progress persist and refresh without duplicated or fabricated data.
- [ ] Push notification opt-in, permissions, disabled state and deep links tested.
- [ ] Safety/legal copy reviewed for medical, wellness and subscription claims.

## Payments and compliance
- [ ] Displayed plan price, introductory offer, currency and renewal terms match each actual StoreKit/Play Billing product in each sales territory.
- [ ] Monthly/annual purchase, restore, active plan, trial, expiration, cancellations and account changes tested in both store sandboxes.
- [ ] Privacy policy, terms and disclaimer URLs load correctly and satisfy store requirements.
- [ ] Handle denied photo/camera permissions and unavailable backend gracefully.
- [ ] Validate privacy declarations, SDK disclosures, store metadata and screenshots for each distribution platform.

## Release gate
- [ ] `npm ci`, `npm run lint`, `npm run typecheck` pass.
- [ ] Android and iOS signed preview builds launch on physical devices.
- [ ] Complete end-to-end smoke test after enabling production API endpoints.
- [ ] Store listing, promotional imagery, app icon, splash and screenshots reviewed at native resolution.
- [ ] Approval by product owner **after** visual QA and store-policy review.

Do not merge/publish solely on the basis of a source-code review.
