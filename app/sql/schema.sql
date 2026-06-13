-- Create reviews table
-- NOTE: Initial FK references auth.users(id). After running profiles.sql,
-- run the migration below to re-point the FK to profiles(id) so PostgREST
-- can resolve the `profiles(...)` join in fetchCommunityReviews.
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  title text not null,
  year text not null,
  rating numeric(3, 2) not null,
  review_text text not null,
  description text,
  poster_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Policies
create policy "Allow public read access"
  on public.reviews for select
  using (true);

create policy "Allow authenticated users to insert their own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Allow users to delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: Re-point FK to profiles so PostgREST can join
-- Run this once in the Supabase SQL Editor after profiles.sql
-- has been applied and the profiles table exists.
-- ============================================================
--
-- alter table public.reviews drop constraint if exists reviews_user_id_fkey;
-- alter table public.reviews
--   add constraint reviews_user_id_fkey
--   foreign key (user_id) references public.profiles(id) on delete set null;




