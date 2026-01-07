-- ==========================================
-- ADMIN FEATURES SETUP
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. ADMIN NOTIFICATIONS
-- ------------------------------------------

create table if not exists admin_notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  target text default 'all', -- 'all', 'premium', 'free'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- RLS for Notifications
alter table admin_notifications enable row level security;

-- Everyone can read notifications
drop policy if exists "Notifications are viewable by everyone" on admin_notifications;
create policy "Notifications are viewable by everyone" on admin_notifications for select using (true);

-- Authenticated users (admins mostly) can insert
drop policy if exists "Authenticated users can insert notifications" on admin_notifications;
create policy "Authenticated users can insert notifications" on admin_notifications for insert with check (auth.role() = 'authenticated');


-- 2. DAILY QUOTES (Günün Sözü)
-- ------------------------------------------

create table if not exists daily_quotes (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Quotes
alter table daily_quotes enable row level security;

-- Everyone can read quotes
drop policy if exists "Quotes are viewable by everyone" on daily_quotes;
create policy "Quotes are viewable by everyone" on daily_quotes for select using (true);

-- Authenticated users can manage quotes
drop policy if exists "Authenticated users can manage quotes" on daily_quotes;
create policy "Authenticated users can manage quotes" on daily_quotes for all using (auth.role() = 'authenticated');
