-- Create tables for Messaging and Notifications

-- Notifications Table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null, -- Who receives the notification
  type text not null, -- 'nudge', 'friend_request', 'hatim_invite', 'message', 'system'
  content text,
  source_id uuid references auth.users(id), -- Who triggered it (optional)
  metadata jsonb, -- Extra data (e.g. hatim part no)
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table notifications enable row level security;
alter table messages enable row level security;

-- Policies for Notifications
drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert notifications" on notifications;
create policy "Users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated'); 

-- Policies for Messages
drop policy if exists "Users can view their messages" on messages;
create policy "Users can view their messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Users can update messages sent to them" on messages;
create policy "Users can update messages sent to them"
  on messages for update
  using (auth.uid() = receiver_id);
