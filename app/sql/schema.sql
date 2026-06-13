-- Create reviews table
create table public.reviews (
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



