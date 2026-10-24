# Treksor Dynamic Atmosphere

Home displays one shared AI-generated portrait landscape to all users. The background is generated server-side every 72 hours, with a daily 03:00 UTC check, and stored in the public `treksor-atmosphere` Supabase Storage bucket. The app reads the newest `public.atmosphere_images` row, caches via expo-image and falls back to bundled daily imagery when none is published or networking fails.

## Deployment (completed)
- `public.atmosphere_images` has RLS public SELECT, backend service role write only.
- Supabase Edge Function `treksor-atmosphere` deployed with JWT gateway verification disabled, but rejects all requests without a cryptographically random shared cron token verified server-side via restricted `verify_atmosphere_cron` RPC. Never expose this token to the app.
- `pg_cron` job `treksor-atmosphere-daily-check` runs at 03:00 UTC; `pg_net` invokes the Edge Function with the secret from Supabase Vault (`treksor_atmosphere_cron_token`). The function checks if the latest published image is less than 72 hours old and skips regeneration if so.
- OpenAI key is read only from Supabase Edge Function secret `OPENAI_API_KEY`; model `gpt-image-1-mini` generates one 1024×1536 image at medium quality per successful rotation.
- A first test on 2026-10-22 returned provider 429 `credit_balance_exhausted`. **API billing credits must be added to the Treksor OpenAI organization** before any image can be generated. No image was published during that test.

## Operations
- Billing: https://platform.openai.com/settings/organization/billing/overview
- Edge Functions: https://supabase.com/dashboard/project/niakfwerfqmrmhuypkpd/functions
- Storage: https://supabase.com/dashboard/project/niakfwerfqmrmhuypkpd/storage/buckets
- To verify scheduler: `select jobname, schedule, active from cron.job where jobname='treksor-atmosphere-daily-check';`
- To verify generated images: `select id,published_at,storage_path from public.atmosphere_images order by published_at desc limit 10;`
- For HTTP failures inspect `net._http_response` and Supabase Edge Function logs. Do not log or reveal API keys or cron tokens.
- A manual invocation requires the Vault token and must be performed server-side; never put it in a client or shared chat.

## Design
Photographic black/charcoal and muted gold, cinematic outdoor scenery, no typography or logos. Home adds a dark gradient to keep all text legible. App binaries retain local imagery for resilience.

## Future hardening
Consider keeping only a rolling number of images, adding an admin preview/approval workflow, provider cost monitoring, and validating image generation after billing activation. Do not claim generation works until a published image has been verified.
