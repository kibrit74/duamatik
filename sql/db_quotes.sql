-- Daily Quotes Table
create table if not exists daily_quotes (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table daily_quotes enable row level security;

drop policy if exists "Quotes are viewable by everyone" on daily_quotes;
create policy "Quotes are viewable by everyone" on daily_quotes for select using (true);

drop policy if exists "Authenticated users can manage quotes" on daily_quotes;
create policy "Authenticated users can manage quotes" on daily_quotes for all using (auth.role() = 'authenticated');
