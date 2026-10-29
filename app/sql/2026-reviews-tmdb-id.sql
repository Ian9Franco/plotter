-- Point new reviews at a TMDb title. Existing rows stay null and remain in the feed.
-- If the unique index fails, there are duplicate (user_id, tmdb_id, media_type) rows.
-- List them and decide. Do not delete user reviews to force the index through.

alter table public.reviews
  add column if not exists tmdb_id integer,
  add column if not exists media_type text;

alter table public.reviews
  drop constraint if exists reviews_media_type_check;

alter table public.reviews
  add constraint reviews_media_type_check
  check (media_type is null or media_type in ('movie', 'tv'));

create index if not exists reviews_title_feed_idx
  on public.reviews (tmdb_id, media_type, created_at desc);

create unique index if not exists reviews_one_per_user_title_idx
  on public.reviews (user_id, tmdb_id, media_type)
  where user_id is not null and tmdb_id is not null;
