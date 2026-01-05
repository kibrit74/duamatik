-- 1. Fix Friendships Permissions (Previous fix)
-- Allow users to insert friendships where they are one of the parties
drop policy if exists "Users can insert their own friendships" on friendships;
create policy "Users can insert their own friendships"
on friendships for insert
with check (
  auth.uid() = user_id or auth.uid() = friend_id
);

-- Ensure users can see their friendships
drop policy if exists "Users can view their own friendships" on friendships;
create policy "Users can view their own friendships"
on friendships for select
using (
  auth.uid() = user_id or auth.uid() = friend_id
);

-- Allow users to delete their friendships
drop policy if exists "Users can delete their own friendships" on friendships;
create policy "Users can delete their own friendships"
on friendships for delete
using (
  auth.uid() = user_id or auth.uid() = friend_id
);

-- 2. Fix Profiles Permissions (NEW Fix for empty friend list)
-- Allow everyone (authenticated) to view basic profile info
-- This is necessary so you can see your friend's name and city
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone"
on profiles for select
using ( true );

-- Allow users to update only their own profile
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );
