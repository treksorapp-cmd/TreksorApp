# Mentor: context, weekly recognition and manageable next steps

Research and implementation: 2 November 2026.

## What the public evidence supports

The reference is Pulso: Asistente de Salud IA, by Pulso Health, Inc., co-created with Sebastián La Rosa, not other products with the same name. Its public positioning combines meal logging, health integrations, contextual conversation (Morfeo), memories, weekly interpretation and simple priorities.

The reviewed App Store comments value companionship, understandable nutrition information and easier logging. The visible Google Play comments also identify ingredient recognition mistakes, slow correction and lost written input. These are a qualitative sample, not representative analytics, verified clinical results or a ranking of most-used features.

No public model name, developer API or licensed access to Pulso's proprietary inference, prompts, knowledge base or scoring algorithm was found in the reviewed official material. The privacy policy describes external AI infrastructure providers without naming the model. Treksor must not claim to use Morfeo, La Rosa's knowledge base or Pulso's engines.

Sources:
- https://pulso.health/
- https://pulso.health/privacidad
- https://pulso.health/terminos
- https://apps.apple.com/us/app/pulso-asistente-de-salud-ia/id6739089618?platform=iphone&see-all=reviews
- https://play.google.com/store/apps/details?hl=es&id=com.pulso.pulso

## Implemented independently in Treksor

- **My context:** create, edit, pause and delete personal notes in the existing owner-protected `ai_memories` table. Five pillar/preference categories. Explicit approval determines future memory use. App and website use the same authenticated endpoint. Existing messages can still contain old context; the UI explains that distinction and offers conversation deletion.
- **My week:** deterministic seven-day summary from Treksor training sessions, completed sets, Balance practices and personal habit check-offs. Deduplication, real calendar validation, source labels, missing-record explanation. Timed practice minutes exclude self-reported durations. Web selects one synced device; mobile uses its current account's local progress.
- **Explicit sharing:** summary preview before each send, allowlisted numbers and dates only, consent checked server-side. The exact shared summary appears in conversation history. Imported Apple/Garmin/Strava records, sleep imports, journals, mood ratings, wake ratings, photos and free-text tracker labels are excluded.
- **Mentor guidance:** acknowledge supported effort; explain uncertainty; offer one optional next step. Nutrition entry asks about ingredients, portions, preferences and allergies. No invented exact nutritional analysis, longevity score, causal sleep improvement or fixed recovery prescription from incomplete records.
- **Reliability:** refresh authentication once, bounded requests, account-change guards, stale-history protection, retained composer draft on errors, recent-message history, accessible context controls. Nutrition links directly to a meal conversation.
- **Ecosystem:** shared context/conversations in mobile and web, browser CORS, private account tabs, source timestamps, manual refresh on web and focus refresh in app.

The existing Treksor backend uses the OpenAI Responses API with `gpt-4.1-mini`. This change retains that provider and model; it does not assert they are Pulso's. Notes are data in a user message, not system instructions. Responses use `store:false`; Treksor separately saves messages to its own database. This is not a claim of zero provider retention.

## Validation and remaining boundaries

`tests/mentor-context.cjs` covers dates, deduplication, allowlists, sharing consent, ownership, request validation and mocked provider integration. The website has auth/XSS/draft/account-switch coverage in `tests/mentor.cjs`. Existing release checks remain required.

No new database schema or third-party credentials are required for these features. Authentication, database and provider service configuration must remain available. Real signed-in provider responses and physical iPhone behaviour still require account/device verification. Native app changes require an updated build; publishing the website or Edge Function does not update an installed iPhone binary.

Not implemented: Pulso API/model integration, food-photo recognition, a verified food nutrient database, clinician-curated retrieval/search, medical outcomes or automatic treatment/recovery prescriptions. Those must not appear as connected features.
