-- Treksor Dynamic Atmosphere: deployed to Supabase treksor-production on 2026-10-22.
-- All users read one shared published background; only the backend can publish.
create table if not exists public.atmosphere_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  prompt text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);
create index if not exists atmosphere_images_published_idx on public.atmosphere_images (published_at desc);
alter table public.atmosphere_images enable row level security;
drop policy if exists "Atmosphere is publicly readable" on public.atmosphere_images;
create policy "Atmosphere is publicly readable" on public.atmosphere_images
  for select to anon, authenticated using (true);
revoke all on public.atmosphere_images from anon, authenticated;
grant select on public.atmosphere_images to anon, authenticated;
grant select, insert, update, delete on public.atmosphere_images to service_role;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('treksor-atmosphere','treksor-atmosphere',true,10485760,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
