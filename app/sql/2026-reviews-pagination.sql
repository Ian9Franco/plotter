-- Pagination indexes for the community feed and "mis reseñas".
-- Apply in the Supabase SQL editor. Do not replay schema.sql for this.

create index if not exists reviews_created_at_idx
  on public.reviews (created_at desc);

create index if not exists reviews_user_id_idx
  on public.reviews (user_id);
