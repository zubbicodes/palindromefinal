-- Allow any authenticated user to read waiting matches (invite code or quick match).
-- Required for: joinByInviteCode (friend looks up by code), findOrCreateQuickMatch (second player finds waiting match).

drop policy if exists "Users can read own matches" on public.matches;

create policy "Users can read own matches"
  on public.matches for select
  using (
    public.is_match_participant(matches.id)
    or matches.created_by = auth.uid()
    -- Allow lookup of waiting matches: quick match (second player joins) + invite code (friend joins)
    or matches.status = 'waiting'
  );
