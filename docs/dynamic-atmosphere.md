# Home image approval workflow

Home reads the newest approved `atmosphere_images` publication whose `published_at` is due. It refreshes on focus, foreground and each minute while Home is visible.

## Sources and schedule

A curated collection of four free Pexels photographs shows men hiking, finding direction and making room for stillness. `home_image_sources` retains the source URL, photographer and title. All four CDN URLs were checked successfully as image/jpeg. License: https://www.pexels.com/license/ . This is a rotating curated collection, not unlimited API search; expand the catalogue to add variety.

`treksor-home-photo-approval-queue` runs hourly and ensures a pending candidate exists for the current and next 48-hour slot. The previous AI generation cron was disabled. No image is generated or purchased by this workflow.

The dashboard's Home atmosphere approval inbox polls every minute and previews pending candidates, credits and Brisbane rotation dates. An admin can approve or reject. Approval publishes immediately for a due slot, or schedules a future publication. Rejection preserves the current approved background. Until the first approval, bundled images remain visible.

## Access

Sources and candidate rows require verified admin membership. `review_home_image` checks membership inside the database and locks the candidate before changing it. Re-review is rejected. Pending candidates never appear in the public Home image table. The authenticated API is covered by same-origin middleware.

Migration SQL: `home-image-approval.sql`. Production cron and initial two pending candidates were checked. Phone push notifications are not part of this dashboard inbox.
