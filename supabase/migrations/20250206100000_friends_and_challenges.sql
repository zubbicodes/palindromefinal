-- Friends and challenges for Chess.com-style matchmaking.

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default now() not null,
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

create index idx_friends_user on public.friends(user_id);
create index idx_friends_friend on public.friends(friend_id);
create index idx_friends_status on public.friends(status) where status = 'pending';

alter table public.friends enable row level security;

create policy "Users can read own friend rows" on public.friends for select
  using (user_id = auth.uid() or friend_id = auth.uid());

create policy "Users can insert friend request" on public.friends for insert
  with check (user_id = auth.uid());

create policy "Friend can update to accept" on public.friends for update
  using (friend_id = auth.uid());

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now() not null
);

create index idx_challenges_to on public.challenges(to_user_id);
create index idx_challenges_match on public.challenges(match_id);

alter table public.challenges enable row level security;

create policy "Users can read own challenges" on public.challenges for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "Users can create challenge" on public.challenges for insert
  with check (from_user_id = auth.uid());

create policy "To user can update challenge" on public.challenges for update
  using (to_user_id = auth.uid());
