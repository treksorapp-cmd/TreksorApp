# Progress: sources before scores

The mobile Progress screen now reads its metrics from the original records, instead of inferring pillar membership from tracker names or averaging unrelated completion percentages. The Architect palette, type hierarchy and navigation remain shared with the rest of Treksor.

## Measures

| Measure | Source | Window / calculation |
| --- | --- | --- |
| Days with a saved action | Training session check-ins, saved gym sets, My space reflection dates, personal journal dates, manual tracker checkmarks | Unique local dates in the last 7 or 30 days, including today. Multiple actions on a day count as one active day. |
| Body | My plan session check-ins; gym sets separately | Selected 7/30-day window. A saved set does not silently create a completed session. |
| Mind | My space and personal journal | Selected window. My space is shared with Purpose; each reflection is counted once. No private writing or mood values appear in this overview. |
| Balance | Distinct meditations marked complete | All-time completed practices / available library. Not sessions or listening minutes. |
| Purpose | Saved vision-board answers | Non-empty saved answers / 10 prompts. Not achieved goals. Missing or unreadable storage is distinct from zero. |
| Personal trackers | User-created tracker items and scheduled boolean date records | Completed check-ins / scheduled check-ins through today. Future days are excluded. Names do not assign them to pillars. |
| Reading | Articles currently in app storage | All-time unique read IDs / unique article IDs. Duplicates across categories count once; any read flag wins. |

Old meditation, article and vision records do not contain completion dates. They remain visible as all-time progress and are not assigned fabricated dates in the activity trail. Empty dates are described as “No record,” not failure. The activity trail links back to each source, and each pillar opens a source/calculation explanation.

## Manual logging

A tracker can contain up to 10 daily actions, scheduled for 1–365 consecutive days beginning on the local date of creation. Every action has its own ID. The log filters by tracker when opened from its card. Saving applies only the selected date to the latest store data, preserving other dates and other trackers. Clearing the final checkmark is allowed. Future and unscheduled dates cannot be checked. Background summary refresh does not replace unfinished form edits. Existing trackers named Body, Mind, Spiritual or Articles are preserved during built-in refresh.

On iOS, calendar-to-log and log-to-create handoffs wait for the previous native modal to dismiss.

The calendar uses local dates and navigates from day one of each month to avoid month-end overflow. Existing saved date keys are retained; no historical record is silently shifted.

## Data boundaries

Account preparation completes before reading account-scoped local vision data. Private journal reads are scoped to the signed-in user, and asynchronous results are discarded on focus/account changes. The overview carries dates and counts, not private reflection or vision text. Existing app-to-web synchronization is retained. No backend migration, cloud restore, Apple Health or smartwatch connection is added. Legacy built-in tracking summaries remain available for compatibility; their blended percentages do not feed the new dashboard.

## Design references

These are observable product patterns, not claims of independently proven commercial performance:

- Apple Health exposes data provenance and source priority: https://support.apple.com/en-au/108779
- Oura explains the contributors behind each measure: https://support.ouraring.com/hc/en-us/articles/360055901214-Activity-Contributors
- Strava pairs a goal with a metric and an explicit period: https://support.strava.com/en-us/articles/15401694-goals-on-the-strava-app

Treksor uses source explanations, explicit time windows, separate measures and contextual next actions, without adopting another product's proprietary scoring system.

## Verification

`npm run test:dashboard` covers Brisbane dates, invalid dates, 7/30-day filtering, deduplication, private-text exclusion, missing versus zero, scheduled-day denominators, unchecking the final item, selected-tracker isolation, real component handlers, empty states and preservation of custom trackers during summary refresh. Existing mobile type, UI, source integrity and account/progress tests also run.

The test can produce React Native Web HTML fixtures with `TREKSOR_QA_DIR=/absolute/path npm run test:dashboard`. These are component render checks, not native screenshots. Native safe areas, font scaling, keyboard behavior and modal transitions still need an iPhone/Android device check.
