# Treksor — Community pilot, safety and launch gates

## Purpose
Create meaningful **in-person** relationships, not a vanity feed or another engagement trap.
The first loop is: discover a hosted experience → choose to RSVP → attend voluntarily → offer useful private feedback → optionally reconnect later.

## Current building blocks
- Supabase `community_events` and `community_registrations` have owner-specific registration RLS.
- A private server trigger now serializes RSVP writes per event and rejects over-capacity requests, even from older web clients.
- Participants may view historical events they registered for.
- `treksor_event_experience_feedback` records only two yes/no signals: whether a connection was made and whether the participant would attend again. No attendee names, location coordinates or messages. RLS is owner-scoped.
- The new app route `/community` shows **real published events** or an honest empty state; offers RSVP/cancel and post-event feedback. No fake attendees or fabricated events.

## Explicit limitations
- An RSVP is not proof of attendance, and a feedback response is not proof a relationship persisted.
- **Privacy blocker:** `community_events.meeting_point` is an existing database column. Although the new mobile UI does not request/display it publicly, the underlying public table's SELECT permissions may expose it through the REST API. Before publishing sensitive meeting locations, move meeting-point data into an attendee/host-only table or restricted server endpoint, then adjust web/admin code and re-test. Do not publish exact private locations until fixed.
- Host verification, moderation, reporting, blocking, abuse rate limits and emergency contact procedures are NOT implemented.
- Do not enable participant-to-participant messaging or public member directories without safeguards.
- There are currently **no upcoming published events**; the UI must show an empty state instead of fictional activity.

## Beta format
Start with a small, hosted gathering, for example a local walk, hike, fitness session or discussion. Require an accountable organizer, a public meeting area, written guidelines, participant consent and an escalation route.
Never infer sensitive attributes or share personal location/history among members.

## Metrics worth learning from
- RSVP → confirmed attendance (manual host check-in required; not yet implemented).
- Percentage of actual attendees who opt into post-event feedback.
- Percentage of respondents who report they would attend again.
- Percentage of attendees who independently choose to meet again at a future gathering, with consent from both parties.
- Complaints, safety incidents, no-shows and event cancellation reasons.

Report results with exact denominators. Do not publish small-group data about social connections that could identify people.

## Pilot exit criteria
- No event-location leak through public API and no cross-account registration visibility.
- Concurrent RSVP test at capacity, cancellation and rejoining, event cancellation and time-zone handling.
- Verified host contact and event safety guidelines.
- Clear participant consent and privacy controls.
- Customer support and abuse reporting ready.
- A minimum of two moderated activities with direct feedback before shipping social recommendations.

## Brand and UI consistency
The Architect: dark restrained palette, warm gold accent, precise typography, practical hierarchy, premium not performative.
Community is a distinct Treksor experience, not a fifth main pillar competing with Body/Mind/Balance/Purpose. Mentor remains the guidance layer. Nutrition belongs under Body.

## Prelaunch stability
- TypeScript and deterministic tests pass on PR.
- iOS and Android account-switching, dark/light modes, offline and screen reader testing.
- Error and retry states don't fabricate data.
- Store billing, subscription recovery, refund/cancellation remain separate QA tracks.
- App privacy, Terms, support contact and data deletion instructions reflect actual behavior.
