-- Race mode hardening:
-- 1. Keep friend challenges out of the public quick-match queue.
-- 2. Finalize race scores/winners in a SECURITY DEFINER RPC so RLS cannot
--    block winner flags on the opponent row.
-- 3. Keep abandoned-match cleanup from cancelling pending friend challenges.

create or replace function public.claim_quick_match(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_result jsonb;
begin
  if p_user_id is null then
    raise exception 'Missing user id';
  end if;

  -- If this user already has an open quick-match lobby, reuse it instead of
  -- creating duplicates or matching them against themselves.
  select m.id into v_match_id
  from public.matches m
  where m.status = 'waiting'
    and m.mode = 'race'
    and m.invite_code is null
    and not exists (
      select 1 from public.challenges c where c.match_id = m.id and c.status = 'pending'
    )
    and exists (
      select 1 from public.match_players mp
      where mp.match_id = m.id and mp.user_id = p_user_id
    )
  order by m.created_at asc
  limit 1;

  if v_match_id is not null then
    select to_jsonb(m.*) into v_result from (select * from public.matches where id = v_match_id) m;
    return v_result;
  end if;

  -- Join the oldest open quick-match lobby owned by another player. Pending
  -- friend challenges also use waiting race matches, so explicitly exclude them.
  select m.id into v_match_id
  from public.matches m
  where m.status = 'waiting'
    and m.mode = 'race'
    and m.invite_code is null
    and not exists (
      select 1 from public.challenges c where c.match_id = m.id and c.status = 'pending'
    )
    and not exists (
      select 1 from public.match_players mp
      where mp.match_id = m.id and mp.user_id = p_user_id
    )
    and (
      select count(*) from public.match_players mp
      where mp.match_id = m.id
    ) = 1
  order by m.created_at asc
  limit 1
  for update skip locked;

  if v_match_id is not null then
    insert into public.match_players (match_id, user_id)
    values (v_match_id, p_user_id)
    on conflict (match_id, user_id) do nothing;

    update public.matches
    set status = 'active', started_at = coalesce(started_at, now())
    where id = v_match_id
      and status = 'waiting';

    select to_jsonb(m.*) into v_result from (select * from public.matches where id = v_match_id) m;
    return v_result;
  end if;

  insert into public.matches (status, mode, seed, invite_code, time_limit_seconds, created_by)
  values ('waiting', 'race', gen_random_uuid()::text, null, 300, p_user_id)
  returning id into v_match_id;

  insert into public.match_players (match_id, user_id)
  values (v_match_id, p_user_id)
  on conflict (match_id, user_id) do nothing;

  select to_jsonb(m.*) into v_result from (select * from public.matches where id = v_match_id) m;
  return v_result;
end;
$$;

grant execute on function public.claim_quick_match(uuid) to authenticated;

create or replace function public.submit_race_score(
  p_match_id uuid,
  p_user_id uuid,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_player_count integer;
  v_submitted_count integer;
  v_score integer;
  v_max_score integer;
  v_winner_count integer;
  v_result jsonb;
begin
  if p_match_id is null or p_user_id is null then
    raise exception 'Missing match or user id';
  end if;

  v_score := greatest(0, coalesce(p_score, 0));

  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.mode <> 'race' then
    raise exception 'submit_race_score can only finalize race matches';
  end if;

  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = p_user_id
  ) then
    raise exception 'Not a participant in this match';
  end if;

  update public.match_players
  set score = v_score,
      submitted_at = coalesce(submitted_at, now())
  where match_id = p_match_id
    and user_id = p_user_id
    and submitted_at is null;

  select count(*), count(*) filter (where submitted_at is not null)
  into v_player_count, v_submitted_count
  from public.match_players
  where match_id = p_match_id;

  if v_player_count >= 2 and v_submitted_count = v_player_count then
    select max(score) into v_max_score
    from public.match_players
    where match_id = p_match_id;

    select count(*) into v_winner_count
    from public.match_players
    where match_id = p_match_id
      and score = v_max_score;

    update public.match_players
    set is_winner = case
      when v_winner_count = 1 and score = v_max_score then true
      else false
    end
    where match_id = p_match_id;

    update public.matches
    set status = 'finished',
        finished_at = coalesce(finished_at, now())
    where id = p_match_id;
  end if;

  select jsonb_build_object(
    'match', to_jsonb(m),
    'players', coalesce(
      jsonb_agg(to_jsonb(mp) order by mp.id) filter (where mp.id is not null),
      '[]'::jsonb
    )
  )
  into v_result
  from public.matches m
  left join public.match_players mp on mp.match_id = m.id
  where m.id = p_match_id
  group by m.id;

  return v_result;
end;
$$;

grant execute on function public.submit_race_score(uuid, uuid, integer) to authenticated;

do $$
declare
  v_jobid integer;
begin
  select jobid into v_jobid
  from cron.job
  where jobname = 'cancel-abandoned-matches'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
exception
  when undefined_table or insufficient_privilege then
    null;
end;
$$;

select cron.schedule(
  'cancel-abandoned-matches',
  '* * * * *',
  $$
    update public.matches
    set status = 'cancelled'
    where status = 'waiting'
    and invite_code is null
    and created_at < now() - interval '60 seconds'
    and not exists (
      select 1 from public.challenges c
      where c.match_id = matches.id and c.status = 'pending'
    )
    and (select count(*) from public.match_players mp where mp.match_id = matches.id) < 2
  $$
);
