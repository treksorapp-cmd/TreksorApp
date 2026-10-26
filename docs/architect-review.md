# Treksor · Architect interface review

Review date: 26 October 2026. Work branch: `design/premium-showcase-2026`.

## Shared system

`theme/architect.ts` defines navy backgrounds, ivory text, champagne accents, neutral raised surfaces, and distinct success/error colors. Page titles are 34/42, section titles 22/29 and card titles 18/25, with semibold weight. Font scaling is retained. Large titles do not auto-shrink or truncate.

`BodyPageHeading` places navigation in a real row above the title. Home and the current pillar no longer float over other content. `PillarMenuScreen` makes photographic menus scrollable and keeps titles and actions in normal flow. Navigation controls have 44-point targets; long text can wrap. Decorative pulse animations respect Reduce Motion.

## Route-family coverage

| Area | Changes and review |
| --- | --- |
| Home | Responsive pillar tiles, hero that grows with text, local-day message selection, next steps based on the saved plan and meditation progress. |
| Body / Gym | Shared headings, exercise lists without hard-coded title offsets, readable cards, completion states and plan actions. |
| Nutrition | Scrollable menus; drink title before photograph; recoverable missing-item screens; supplement sources retained. |
| Mind / My space | Shared headings on list/create/view/edit/success; one scroll flow for the overview; empty state; preserved return context. |
| Purpose | Goals & reflections reuses the existing journal data through a Purpose route; navigation stays associated with Purpose. This is reflection, not a new goal-tracking backend. |
| Balance | Title, description, image, audio controls, guidance and completion in order; Home and Balance controls; download/retry/busy states; sound cleanup when leaving. Completion eligibility is retained. |
| Articles | Consistent headings, complete card titles, corrected media URLs, missing-article recovery, footer in flow and no duplicated stack header. |
| Progress | Single heading; the entire page scrolls; removed a period selector that did not filter displayed data; pillar rows open their pillar; visible app/web sync status. |
| Community | Working links to web groups, one-to-one and mentors; clearly identified web/Meetup destinations; event-feed error, retry and empty states. |
| Chat | Scrollable welcome content, Android/iOS keyboard events, message/send labels and preserved failed-send drafts in the reusable modal. |
| Profile | Working back control, no duplicated top inset, absolute/relative avatar URLs, quiet destructive styling. |
| Authentication | In-flow back controls, safe-area form padding, flexible input errors, responsive OTP and social buttons; shared accent colors. |
| Modals & documents | Safe-area spacing, Android dismissal, scrollable plan selection, consistent surfaces and close controls. |

52 screen modules (including wrapper and compatibility routes), plus components, are covered by the source-integrity check. This is a source review, not a claim that 52 screens were operated on a device.

## Verification

- `npm run typecheck`: checks the mobile app and its shared source. `tsconfig.mobile.json` excludes Deno Edge Functions, which use a different runtime; it does not suppress native application errors.
- `npm run test:ui`: server-renders actual React components with platform adapters to check pillar navigation, Purpose context, full heading text, drink/photo and meditation/player order, completion and empty states.
- `npm run test:integrity`: detects missing named styles and bundled media across screen/component modules.
- `npm run test:progress`: verifies private-text exclusion, account isolation and preservation of saved progress.
- `npm run test:audio`: checks duplicate taps, atomic caching, failed downloads and leaving during download with mocked native services.
- Expo iOS and Android production JavaScript exports.

## Device verification still required

There is no connected native simulator or phone in this workspace. Server rendering and successful exports do not establish pixel-perfect native layout or actual audio playback.

On the updated dev client, verify 320–430-point phone widths, default/enlarged system text, long article/meditation titles, keyboard-open forms, safe-area cutouts and Reduce Motion. Exercise audio download, pause/resume, completion and leaving during download. Confirm app/web profile sync using the same account. Watch integration remains a future feature; no new watch connectivity is claimed or implemented here.
