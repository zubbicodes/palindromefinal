-- Fix infinite recursion: match_players SELECT policy queried match_players,
-- causing RLS to re-trigger. Use a SECURITY DEFINER function to bypass RLS.

create or replace function public.is_match_participant(match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.match_players mp
    where mp.match_id = is_match_participant.match_id
    and mp.user_id = auth.uid()
  );
$$;

-- Drop the recursive policies
drop policy if exists "Users can read own matches" on public.matches;
drop policy if exists "Users can update matches they are in" on public.matches;
drop policy if exists "Users can read match_players for own matches" on public.match_players;

-- Recreate using the function (no recursion)
create policy "Users can read own matches"
  on public.matches for select
  using (public.is_match_participant(matches.id));

create policy "Users can update matches they are in"
  on public.matches for update
  using (public.is_match_participant(matches.id));

create policy "Users can read match_players for own matches"
  on public.match_players for select
  using (public.is_match_participant(match_players.match_id));
