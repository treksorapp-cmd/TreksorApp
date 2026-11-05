# Community location and discovery

- Native Community and the website read the same `community_events` published/future rows under RLS. Groups and profiles retain their existing join/invitation flows and policies.
- Search is city-level, accent-insensitive and case-insensitive, with comma-separated qualifiers. It is not a GPS distance/radius search. City-only legacy listings are included but displayed with their stored location; adding country to admin records disambiguates future listings. Local-language aliases (e.g. Tokyo / 東京) are not yet resolved automatically.
- Native uses Expo Location 18.1.6 with foreground permission and native reverse geocoding, only on button press. A new iOS/Android binary is required. No background tracking or location upload to Treksor.
- Web uses consented browser coordinates with BigDataCloud's free client-side city endpoint. The UI discloses the provider and anonymous GPS/IP use before the action. No IP fallback, background refresh, stored coordinates or server calls to this endpoint. Reference: https://www.bigdatacloud.com/docs/free-api/free-reverse-geocode-to-city-api
- The selected city travels in the URL hash from app to web and across Community tabs. Explicit Search commits edits. Late location or route responses do not replace a newer selection.
- External discovery opens Google Maps with the exact selected destination; these are searches for clubs/places, not imported or verified Treksor events. There is no automatic external event booking or ingestion.
- Public events previously lacked SELECT grants despite a published-only policy. Migration 20261103093729 restores read access under RLS and service-role management. No registration rights were added; event reservation/capacity enforcement remains out of scope.

Validation: native typecheck/UI suite, city/country and time filtering tests, web location/navigation/XSS/pagination/race tests, existing portal/member-access/Mentor tests, live API read, transaction-only draft/past isolation checks. All test event rows roll back.

Environment limit: managed browser preview daemon unavailable; physical-device geolocation and complete signed-in visual QA remain pending.
Existing unrelated Supabase advisories were unchanged: home-image review SECURITY DEFINER callable by authenticated (https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), leaked-password protection disabled (https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
