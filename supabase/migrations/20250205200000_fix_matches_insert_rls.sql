-- Fix: INSERT+SELECT fails because creator can't read match before they're in match_players.
-- Add created_by so the creator can read the match immediately after insert.

alter table public.matches
  add column if not exists created_by uuid references auth.users(id);

-- Default to current user on insert (for backwards compat with existing rows)
update public.matches set created_by = (
  select mp.user_id from public.match_players mp
  where mp.match_id = matches.id
  limit 1
) where created_by is null;

-- Drop and recreate insert policy: only authenticated users, must set self as creator
drop policy if exists "Users can create matches" on public.matches;
create policy "Users can create matches"
  on public.matches for insert
  to authenticated
  with check (auth.uid() is not null and (created_by is null or created_by = auth.uid()));

-- Update SELECT policy: allow creator OR participant to read
drop policy if exists "Users can read own matches" on public.matches;
create policy "Users can read own matches"
  on public.matches for select
  using (
    public.is_match_participant(matches.id)
    or matches.created_by = auth.uid()
  );
