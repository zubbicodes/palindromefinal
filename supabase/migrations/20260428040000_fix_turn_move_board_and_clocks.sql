-- Turn move hardening:
-- - persist the placed color into turn_match_states.board
-- - subtract elapsed time from only the active player's clock
-- - switch current_turn_user_id after a valid move
-- - return the updated turn state for immediate UI sync

create or replace function public.submit_turn_move(
  p_match_id uuid,
  p_user_id uuid,
  p_row integer,
  p_col integer,
  p_color integer,
  p_score_delta integer,
  p_time_spent_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.turn_match_states%rowtype;
  v_match public.matches%rowtype;
  v_board jsonb;
  v_row jsonb;
  v_player1_blocks jsonb;
  v_player2_blocks jsonb;
  v_remaining integer;
  v_next_turn uuid;
  v_now timestamptz := now();
  v_elapsed_ms integer;
  v_max_score integer;
  v_winner_count integer;
  v_finished_reason text := null;
  v_winner uuid := null;
  v_result jsonb;
begin
  if p_row < 0 or p_row > 10 or p_col < 0 or p_col > 10 then
    raise exception 'Move is outside the board';
  end if;

  if p_color < 0 or p_color > 4 then
    raise exception 'Invalid color';
  end if;

  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found or v_match.mode <> 'turn' then
    raise exception 'Invalid turn match';
  end if;

  select * into v_state
  from public.turn_match_states
  where match_id = p_match_id
  for update;

  if not found then
    raise exception 'Turn state not found';
  end if;

  if v_state.finished_reason is not null or v_match.status = 'finished' then
    raise exception 'Match is already finished';
  end if;

  if p_user_id not in (v_state.player1_user_id, v_state.player2_user_id) then
    raise exception 'Not a participant in this match';
  end if;

  if v_state.current_turn_user_id is null then
    v_state.current_turn_user_id := v_state.player1_user_id;
  end if;

  if v_state.current_turn_user_id <> p_user_id then
    raise exception 'Not your turn';
  end if;

  v_board := to_jsonb(v_state.board);
  if jsonb_typeof(v_board) <> 'array' or jsonb_array_length(v_board) <> 11 then
    raise exception 'Board is not initialized';
  end if;

  if (v_board -> p_row -> p_col) <> 'null'::jsonb then
    raise exception 'Cell is already occupied';
  end if;

  if p_user_id = v_state.player1_user_id then
    v_player1_blocks := to_jsonb(v_state.player1_blocks);
    v_remaining := coalesce((v_player1_blocks ->> p_color)::integer, 0);
    if v_remaining <= 0 then
      raise exception 'No blocks left for this color';
    end if;
    v_player1_blocks := jsonb_set(v_player1_blocks, array[p_color::text], to_jsonb(v_remaining - 1), false);
    v_player2_blocks := to_jsonb(v_state.player2_blocks);
    v_next_turn := v_state.player2_user_id;
  else
    v_player2_blocks := to_jsonb(v_state.player2_blocks);
    v_remaining := coalesce((v_player2_blocks ->> p_color)::integer, 0);
    if v_remaining <= 0 then
      raise exception 'No blocks left for this color';
    end if;
    v_player2_blocks := jsonb_set(v_player2_blocks, array[p_color::text], to_jsonb(v_remaining - 1), false);
    v_player1_blocks := to_jsonb(v_state.player1_blocks);
    v_next_turn := v_state.player1_user_id;
  end if;

  v_row := jsonb_set(v_board -> p_row, array[p_col::text], to_jsonb(p_color), false);
  v_board := jsonb_set(v_board, array[p_row::text], v_row, false);

  v_elapsed_ms := greatest(
    0,
    least(
      300000,
      coalesce(
        p_time_spent_ms,
        floor(extract(epoch from (v_now - coalesce(v_state.turn_started_at, v_now))) * 1000)::integer
      )
    )
  );

  insert into public.turn_match_moves (
    match_id,
    move_number,
    user_id,
    row,
    col,
    color,
    score_delta,
    time_spent_ms
  )
  values (
    p_match_id,
    coalesce(v_state.move_number, 0) + 1,
    p_user_id,
    p_row,
    p_col,
    p_color,
    greatest(0, coalesce(p_score_delta, 0)),
    v_elapsed_ms
  );

  if p_user_id = v_state.player1_user_id then
    v_state.player1_time_ms := greatest(0, coalesce(v_state.player1_time_ms, 300000) - v_elapsed_ms);
    v_state.player1_score := coalesce(v_state.player1_score, 0) + greatest(0, coalesce(p_score_delta, 0));
    if v_state.player1_time_ms <= 0 then
      v_finished_reason := 'timeout';
      v_winner := v_state.player2_user_id;
    end if;
  else
    v_state.player2_time_ms := greatest(0, coalesce(v_state.player2_time_ms, 300000) - v_elapsed_ms);
    v_state.player2_score := coalesce(v_state.player2_score, 0) + greatest(0, coalesce(p_score_delta, 0));
    if v_state.player2_time_ms <= 0 then
      v_finished_reason := 'timeout';
      v_winner := v_state.player1_user_id;
    end if;
  end if;

  if v_finished_reason is null and (
    not exists (
      select 1
      from jsonb_array_elements(v_board) row_value
      where row_value.value @> '[null]'::jsonb
    )
  ) then
    v_finished_reason := 'board_full';
  end if;

  if v_finished_reason is null and (
    select coalesce(sum((value)::integer), 0) from jsonb_array_elements_text(
      case when p_user_id = v_state.player1_user_id then v_player1_blocks else v_player2_blocks end
    )
  ) = 0 then
    v_finished_reason := 'score';
  end if;

  if v_finished_reason is not null and v_winner is null then
    if v_state.player1_score > v_state.player2_score then
      v_winner := v_state.player1_user_id;
    elsif v_state.player2_score > v_state.player1_score then
      v_winner := v_state.player2_user_id;
    else
      v_winner := null;
    end if;
  end if;

  update public.turn_match_states
  set board = v_board,
      player1_blocks = v_player1_blocks,
      player2_blocks = v_player2_blocks,
      player1_score = v_state.player1_score,
      player2_score = v_state.player2_score,
      player1_time_ms = v_state.player1_time_ms,
      player2_time_ms = v_state.player2_time_ms,
      current_turn_user_id = case when v_finished_reason is null then v_next_turn else null end,
      move_number = coalesce(v_state.move_number, 0) + 1,
      turn_started_at = v_now,
      winner_user_id = v_winner,
      finished_reason = v_finished_reason,
      updated_at = v_now
  where match_id = p_match_id;

  if v_finished_reason is not null then
    update public.matches
    set status = 'finished',
        finished_at = coalesce(finished_at, v_now)
    where id = p_match_id;

    update public.match_players
    set score = case
          when user_id = v_state.player1_user_id then v_state.player1_score
          when user_id = v_state.player2_user_id then v_state.player2_score
          else score
        end,
        submitted_at = coalesce(submitted_at, v_now)
    where match_id = p_match_id;

    select max(score) into v_max_score
    from public.match_players
    where match_id = p_match_id;

    select count(*) into v_winner_count
    from public.match_players
    where match_id = p_match_id and score = v_max_score;

    update public.match_players
    set is_winner = case when v_winner_count = 1 and score = v_max_score then true else false end
    where match_id = p_match_id;
  end if;

  select to_jsonb(tms.*) into v_result
  from public.turn_match_states tms
  where tms.match_id = p_match_id;

  return v_result;
end;
$$;

grant execute on function public.submit_turn_move(uuid, uuid, integer, integer, integer, integer, integer) to authenticated;

create or replace function public.expire_turn_clock(
  p_match_id uuid,
  p_timed_out_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.turn_match_states%rowtype;
  v_match public.matches%rowtype;
  v_now timestamptz := now();
  v_elapsed_ms integer;
  v_winner uuid;
  v_max_score integer;
  v_winner_count integer;
  v_result jsonb;
begin
  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found or v_match.mode <> 'turn' then
    raise exception 'Invalid turn match';
  end if;

  select * into v_state
  from public.turn_match_states
  where match_id = p_match_id
  for update;

  if not found then
    raise exception 'Turn state not found';
  end if;

  if v_state.finished_reason is not null or v_match.status = 'finished' then
    select to_jsonb(tms.*) into v_result
    from public.turn_match_states tms
    where tms.match_id = p_match_id;
    return v_result;
  end if;

  if v_state.current_turn_user_id <> p_timed_out_user_id then
    raise exception 'This player is not on turn';
  end if;

  v_elapsed_ms := greatest(
    0,
    least(
      300000,
      floor(extract(epoch from (v_now - coalesce(v_state.turn_started_at, v_now))) * 1000)::integer
    )
  );

  if p_timed_out_user_id = v_state.player1_user_id then
    v_state.player1_time_ms := greatest(0, coalesce(v_state.player1_time_ms, 300000) - v_elapsed_ms);
    v_winner := v_state.player2_user_id;
  elsif p_timed_out_user_id = v_state.player2_user_id then
    v_state.player2_time_ms := greatest(0, coalesce(v_state.player2_time_ms, 300000) - v_elapsed_ms);
    v_winner := v_state.player1_user_id;
  else
    raise exception 'Timed out user is not a participant';
  end if;

  update public.turn_match_states
  set player1_time_ms = v_state.player1_time_ms,
      player2_time_ms = v_state.player2_time_ms,
      current_turn_user_id = null,
      winner_user_id = v_winner,
      finished_reason = 'timeout',
      updated_at = v_now
  where match_id = p_match_id;

  update public.matches
  set status = 'finished',
      finished_at = coalesce(finished_at, v_now)
  where id = p_match_id;

  update public.match_players
  set score = case
        when user_id = v_state.player1_user_id then v_state.player1_score
        when user_id = v_state.player2_user_id then v_state.player2_score
        else score
      end,
      submitted_at = coalesce(submitted_at, v_now)
  where match_id = p_match_id;

  select max(score) into v_max_score
  from public.match_players
  where match_id = p_match_id;

  select count(*) into v_winner_count
  from public.match_players
  where match_id = p_match_id and score = v_max_score;

  update public.match_players
  set is_winner = case when user_id = v_winner then true else false end
  where match_id = p_match_id;

  select to_jsonb(tms.*) into v_result
  from public.turn_match_states tms
  where tms.match_id = p_match_id;

  return v_result;
end;
$$;

grant execute on function public.expire_turn_clock(uuid, uuid) to authenticated;
