-- Create Prayer Packages Table
create table if not exists prayer_packages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  icon_url text,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Relation table: Package <-> Prayers
create table if not exists package_items (
  id uuid default gen_random_uuid() primary key,
  package_id uuid references prayer_packages(id) on delete cascade,
  prayer_id uuid references prayers(id) on delete cascade,
  display_order int default 0
);

-- RLS Policies
alter table prayer_packages enable row level security;
alter table package_items enable row level security;

-- Everyone can view packages
drop policy if exists "Packages are viewable by everyone" on prayer_packages;
create policy "Packages are viewable by everyone" on prayer_packages for select using (true);

drop policy if exists "Package items are viewable by everyone" on package_items;
create policy "Package items are viewable by everyone" on package_items for select using (true);

-- Admin Policies (Assuming specific users are admins, for now permissive for authenticated users until role system is robust)
-- In a real production app, we would strictly check (select role from profiles where id = auth.uid()) = 'admin'
drop policy if exists "Admins can manage packages" on prayer_packages;
create policy "Admins can manage packages" on prayer_packages for all using (
  auth.uid() in (select id from profiles where role = 'admin')
);

drop policy if exists "Admins can manage package items" on package_items;
create policy "Admins can manage package items" on package_items for all using (
  auth.uid() in (select id from profiles where role = 'admin')
);
