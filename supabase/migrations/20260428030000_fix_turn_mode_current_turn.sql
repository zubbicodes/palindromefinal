-- Turn mode hardening: repair active matches where current_turn_user_id is
-- null/invalid or player2_user_id still contains the player1 placeholder.

create or replace function public.normalize_turn_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.turn_match_states%rowtype;
  v_match public.matches%rowtype;
  v_player1 uuid;
  v_player2 uuid;
  v_current uuid;
  v_result jsonb;
begin
  select * into v_match
  from public.matches
  where id = p_match_id;

  if not found then
    raise exception 'Match not found';
  end if;

  select * into v_state
  from public.turn_match_states
  where match_id = p_match_id
  for update;

  if not found then
    raise exception 'Turn state not found';
  end if;

  v_player1 := v_state.player1_user_id;

  select mp.user_id into v_player2
  from public.match_players mp
  where mp.match_id = p_match_id
    and mp.user_id <> v_player1
  order by mp.id
  limit 1;

  if v_player2 is null and v_state.player2_user_id <> v_player1 then
    v_player2 := v_state.player2_user_id;
  end if;

  if v_match.status = 'active' and v_player1 is not null and v_player2 is not null then
    v_current := case
      when v_state.current_turn_user_id in (v_player1, v_player2) then v_state.current_turn_user_id
      else v_player1
    end;

    update public.turn_match_states
    set player2_user_id = v_player2,
        current_turn_user_id = v_current,
        turn_started_at = coalesce(turn_started_at, now()),
        updated_at = now()
    where match_id = p_match_id;
  end if;

  select to_jsonb(tms.*) into v_result
  from public.turn_match_states tms
  where tms.match_id = p_match_id;

  return v_result;
end;
$$;

grant execute on function public.normalize_turn_match(uuid) to authenticated;
