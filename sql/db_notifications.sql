-- Create Admin Notifications Table
create table if not exists admin_notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  target text default 'all', -- 'all', 'premium', 'free'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table admin_notifications enable row level security;

-- Policies
-- Everyone can read notifications (filtering logic will be in app or specific policy)
drop policy if exists "Notifications are viewable by everyone" on admin_notifications;
create policy "Notifications are viewable by everyone" on admin_notifications for select using (true);

-- Only admins can insert (This relies on app logic or specific admin check if we had role in auth.jwt)
-- For now, we allow authenticated users to insert, but in a real app we'd restrict to admin role
drop policy if exists "Authenticated users can insert notifications" on admin_notifications;
create policy "Authenticated users can insert notifications" on admin_notifications for insert with check (auth.role() = 'authenticated');
