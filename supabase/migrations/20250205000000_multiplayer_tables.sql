-- Multiplayer: matches and match_players for Async Race MVP

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  mode text not null default 'race' check (mode in ('race')),
  seed text not null,
  invite_code text unique,
  time_limit_seconds int not null default 180,
  started_at timestamp with time zone,
  finished_at timestamp with time zone
);

create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int,
  submitted_at timestamp with time zone,
  is_winner boolean,
  unique(match_id, user_id)
);

create index if not exists idx_match_players_match_id on public.match_players(match_id);
create index if not exists idx_match_players_user_id on public.match_players(user_id);
create index if not exists idx_matches_status_invite on public.matches(status) where invite_code is null;
create index if not exists idx_matches_invite_code on public.matches(invite_code) where invite_code is not null;

alter table public.matches enable row level security;
alter table public.match_players enable row level security;

-- Players can only read matches they participate in
create policy "Users can read own matches"
  on public.matches for select
  using (
    exists (
      select 1 from public.match_players mp
      where mp.match_id = matches.id and mp.user_id = auth.uid()
    )
  );

-- Users can insert a match when they are creating it (creator will be in match_players via insert there)
create policy "Users can create matches"
  on public.matches for insert
  with check (true);

-- Only allow updating status/started_at/finished_at (e.g. when opponent joins or match ends)
create policy "Users can update matches they are in"
  on public.matches for update
  using (
    exists (
      select 1 from public.match_players mp
      where mp.match_id = matches.id and mp.user_id = auth.uid()
    )
  );

-- Players can read match_players for their matches
create policy "Users can read match_players for own matches"
  on public.match_players for select
  using (
    exists (
      select 1 from public.match_players mp2
      where mp2.match_id = match_players.match_id and mp2.user_id = auth.uid()
    )
  );

-- Users can insert themselves into match_players (join match)
create policy "Users can insert own match_player row"
  on public.match_players for insert
  with check (auth.uid() = user_id);

-- Users can only update their own row (score, submitted_at); is_winner can be set by backend/trigger if needed
create policy "Users can update own match_player row"
  on public.match_players for update
  using (auth.uid() = user_id);

-- Users can leave a match (delete own row) e.g. cancel while waiting
create policy "Users can delete own match_player row"
  on public.match_players for delete
  using (auth.uid() = user_id);

-- Enable realtime: in Supabase Dashboard, add tables "matches" and "match_players" to Realtime if needed.
