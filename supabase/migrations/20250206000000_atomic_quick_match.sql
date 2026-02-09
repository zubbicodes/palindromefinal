-- Atomic quick match RPC: prevents race when multiple players click Find Match at once.

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
  select m.id into v_match_id
  from matches m
  where m.status = 'waiting' and m.invite_code is null
  order by m.created_at asc
  limit 1
  for update skip locked;

  if v_match_id is not null then
    if exists (select 1 from match_players where match_id = v_match_id and user_id = p_user_id) then
      select to_jsonb(m.*) into v_result from (select * from matches where id = v_match_id) m;
      return v_result;
    end if;

    insert into match_players (match_id, user_id) values (v_match_id, p_user_id);
    update matches set status = 'active', started_at = now() where id = v_match_id;

    select to_jsonb(m.*) into v_result from (select * from matches where id = v_match_id) m;
    return v_result;
  end if;

  insert into matches (status, mode, seed, invite_code, time_limit_seconds, created_by)
  values ('waiting', 'race', gen_random_uuid()::text, null, 300, p_user_id)
  returning id into v_match_id;

  insert into match_players (match_id, user_id) values (v_match_id, p_user_id);

  select to_jsonb(m.*) into v_result from (select * from matches where id = v_match_id) m;
  return v_result;
end;
$$;

grant execute on function public.claim_quick_match(uuid) to authenticated;
