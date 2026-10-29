-- Let PostgREST embed profiles(...) on reviews.
-- Same statements that are commented at the bottom of schema.sql.
-- Apply once, after profiles.sql. Do not edit schema.sql as if the table were new.

alter table public.reviews drop constraint if exists reviews_user_id_fkey;

alter table public.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
