# Treksor user website

The Architect website and member community, created 2026-10-24.

Site: https://treksor-community.oceanicman.chatgpt.site

## Structure

Buildless HTML/CSS/JavaScript in `dist/`. The GitHub mirror lives at `web/treksor-community/` on `design/premium-showcase-2026`. Run `python fetch-assets.py` there to restore the photograph; the hosted Site repository already contains it. Supabase JavaScript 2.102.0 is vendored for predictable browser loading. `dist/config.js` contains only the publishable project key, never service credentials. Supabase project: `niakfwerfqmrmhuypkpd`. Existing mobile tables, routes, and authentication accounts are preserved.

Routes use hashes so static hosting does not require rewrite rules:

- `#/`: website and brand introduction.
- `#/ecosistema`: Body, Mind, Balance, Purpose and introductory practices.
- `#/community`: public group discovery, category/city filters, group creation.
- `#/community/uno-a-uno`: opt-in member discovery and private invitations.
- `#/community/mentores`: approved mentor discovery and applications.
- `#/espacio`: profile, memberships, invitations, conversations, blocks.
- `#/grupo/:id`: group description, membership and member-only discussions.
- `#/conexion/:id`: participant-only conversation after acceptance.
- `#/gestion`: mentor approvals and reports, restricted to existing `admin_members`.

## Database

Applied migrations, in order:

1. `treksor_web_community` (`schema.sql`).
2. `treksor_web_profile_visibility` (`fix-profile-policy.sql`).

All new tables use `web_` names and row-level security. Profile visibility defaults off. Only a recipient can accept an invitation; message insertion requires accepted status and no block in either direction. Profile/connection ownership columns cannot be reassigned. Mentors cannot approve themselves. Group discussions require membership or group ownership. Report visibility is limited to reporter and admin.

`treksor_private.is_web_contact(uuid)` is a restricted, non-exposed boolean helper that breaks a recursive policy dependency. It checks the current authenticated caller's participation and returns no profile fields. It uses a fixed empty search path and restricted execute grants.

`test-permissions.sql` runs synthetic fixtures entirely inside a transaction ending in rollback. It does not create persistent accounts, messages, groups, reports, or memberships. Run only before real records exist unless counts are scoped to fixtures.

## Product boundaries

- The site is initially owner-private for review; wider audience requires a hosting access change.
- No fictitious groups, people, mentor credentials, availability, testimonials, or activity counts are seeded.
- Existing Treksor email/password accounts can sign in. New registration uses the existing Supabase email-confirmation configuration. Confirm the email and return to sign in; email delivery and redirects must be verified with a real recipient before wider rollout.
- Existing social-only accounts need a password configured through the existing account flow. Password recovery and social login are not added here.
- Conversations and inbox update via explicit refresh; there are no push/email notifications or real-time delivery indicators.
- Mentor requests create in-app invitations. Session scheduling, prices, contracts and payments are agreed directly; there is no automatic booking or billing.
- Format 'small' expresses a group's preferred size, not an enforced capacity.
- Profiles expose city, not exact location; no geolocation tracking.
- The mobile app is not automatically wired to the new web community tables. Both surfaces share authentication and the same backend project; native community integration is a subsequent task.
- Profile editing, visibility, membership withdrawal and blocking are available. Complete account deletion and data export are not implemented on this website.
- Supabase reported existing leaked-password protection disabled. Review: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Validation

- `node --check dist/app.js`.
- RLS transaction suite: profile privacy, ownership, membership, invitation acceptance, message isolation, blocking, mentor review, reports, anonymous access.
- No new RLS/security advisor findings after migrations; existing auth password-protection warning remains.
- Managed local preview unavailable (missing `sites-previewd` mailbox). Deployment succeeded. Browser reached the private ChatGPT sign-in gate, so desktop/mobile visual QA and real email/password login remain unverified. No access restrictions were bypassed.
- Public Data API smoke checks: groups accessible; private profiles and messages reject anonymous access.
- Transaction fixture cleanup confirmed: no test users or community records persisted.

## Assets

Forest photograph: Jeffrey Eisen, Unsplash, https://unsplash.com/es/fotos/gente-caminando-junto-a-las-colinas-1YAAaJIqzPg . Used as atmospheric imagery, not an actual Treksor event.

Manrope font served through Google Fonts with local sans-serif fallback. Supabase JS license included in `dist/assets/SUPABASE-LICENSE.txt`.
