-- Only the two recordings explicitly assigned to Balance; not the whole media bucket.
create policy "Read assigned Balance recordings" on storage.objects for select to anon, authenticated
using (bucket_id='treksor-media' and name in ('b7506c16-a302-4de7-be01-44458a28757d.mp4','d6f4cfc7-e5ab-44f4-92c6-a54286add778.mp4'));
