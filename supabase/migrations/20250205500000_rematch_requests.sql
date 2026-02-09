-- Rematch requests: when user clicks Rematch, prompt opponent to Accept/Decline.
-- If both click Rematch before seeing popup, merge into one match.

create table if not exists public.rematch_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_match_id uuid references public.matches(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

create index if not exists idx_rematch_match_from_to on public.rematch_requests(match_id, from_user_id, to_user_id);
create index if not exists idx_rematch_to_user on public.rematch_requests(to_user_id, status) where status = 'pending';

alter table public.rematch_requests enable row level security;

-- Users can read rematch requests for matches they participated in
create policy "Users can read rematch requests for their matches"
  on public.rematch_requests for select
  using (
    from_user_id = auth.uid() or to_user_id = auth.uid()
  );

-- Users can insert their own request (from_user_id = self)
create policy "Users can create rematch requests"
  on public.rematch_requests for insert
  with check (from_user_id = auth.uid());

-- to_user can update (accept/decline)
create policy "To user can update rematch request"
  on public.rematch_requests for update
  using (to_user_id = auth.uid());

-- Enable Realtime: In Supabase Dashboard, Database > Replication, add rematch_requests to the publication
