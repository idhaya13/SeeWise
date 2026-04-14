-- ============================================================
-- FlickBook / SeeWise — Supabase Database Fix
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. PLAYLISTS TABLE (create if not exists)
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Watchlist',
  created_at timestamptz default now()
);

-- 2. PLAYLIST ITEMS TABLE
-- Drop and recreate to ensure correct schema (this is safe if data was not syncing anyway)
drop table if exists public.playlist_items cascade;
create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null default 'movie',
  item_data jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(playlist_id, item_id)
);

-- 3. RATINGS TABLE
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

-- 4. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  item_id text not null,
  text text not null,
  timestamp bigint,
  created_at timestamptz default now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;

-- ============================================================
-- DROP OLD POLICIES (clean slate)
-- ============================================================

drop policy if exists "Users can view their own playlists" on public.playlists;
drop policy if exists "Users can create their own playlists" on public.playlists;
drop policy if exists "Users can update their own playlists" on public.playlists;
drop policy if exists "Users can delete their own playlists" on public.playlists;

drop policy if exists "Users can view their own playlist items" on public.playlist_items;
drop policy if exists "Users can add to their own playlist items" on public.playlist_items;
drop policy if exists "Users can update their own playlist items" on public.playlist_items;
drop policy if exists "Users can delete their own playlist items" on public.playlist_items;

drop policy if exists "Users can view their own ratings" on public.ratings;
drop policy if exists "Users can upsert their own ratings" on public.ratings;
drop policy if exists "Users can update their own ratings" on public.ratings;
drop policy if exists "Users can delete their own ratings" on public.ratings;

drop policy if exists "Users can view their own comments" on public.comments;
drop policy if exists "Users can add their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

-- ============================================================
-- RLS POLICIES — PLAYLISTS
-- ============================================================

create policy "Users can view their own playlists"
  on public.playlists for select
  using (auth.uid() = user_id);

create policy "Users can create their own playlists"
  on public.playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own playlists"
  on public.playlists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own playlists"
  on public.playlists for delete
  using (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — PLAYLIST ITEMS
-- ============================================================

create policy "Users can view their own playlist items"
  on public.playlist_items for select
  using (auth.uid() = user_id);

create policy "Users can add to their own playlist items"
  on public.playlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own playlist items"
  on public.playlist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own playlist items"
  on public.playlist_items for delete
  using (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — RATINGS
-- ============================================================

create policy "Users can view their own ratings"
  on public.ratings for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own ratings"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on public.ratings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own ratings"
  on public.ratings for delete
  using (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — COMMENTS
-- ============================================================

create policy "Users can view their own comments"
  on public.comments for select
  using (auth.uid() = user_id);

create policy "Users can add their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Done! All tables and policies are set up correctly.
-- ============================================================
