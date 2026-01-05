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
