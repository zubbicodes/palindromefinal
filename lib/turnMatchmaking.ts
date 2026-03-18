/**
 * Turn-based matchmaking service for Palindrome.
 * Handles turn-mode match creation, joining, move submission,
 * real-time state sync, and forfeit.
 */

import { getSupabaseClient } from '@/supabase';
import { createInitialState } from './gameEngine';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Match } from './matchmaking';

export const TURN_TIME_LIMIT_MS = 300_000; // 5 minutes per player

export interface TurnMatchState {
  match_id: string;
  player1_user_id: string;
  player2_user_id: string;
  current_turn_user_id: string | null;
  board: (number | null)[][];
  player1_blocks: number[];
  player2_blocks: number[];
  player1_score: number;
  player2_score: number;
  player1_time_ms: number;
  player2_time_ms: number;
  move_number: number;
  turn_started_at: string;
  winner_user_id: string | null;
  finished_reason: string | null;
  updated_at: string;
  bulldog_positions: { row: number; col: number }[];
}

export interface TurnMove {
  id: string;
  match_id: string;
  move_number: number;
  user_id: string;
  row: number;
  col: number;
  color: number;
  score_delta: number;
  time_spent_ms: number;
  created_at: string;
}

// ── helpers ────────────────────────────────────────────
const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 6; i++) code += ALPHANUM[array[i] % ALPHANUM.length];
  return code;
}

function generateSeed(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Parse raw DB row into typed TurnMatchState */
function parseTurnState(raw: any): TurnMatchState {
  return {
    match_id: raw.match_id,
    player1_user_id: raw.player1_user_id,
    player2_user_id: raw.player2_user_id,
    current_turn_user_id: raw.current_turn_user_id,
    board: typeof raw.board === 'string' ? JSON.parse(raw.board) : raw.board,
    player1_blocks: typeof raw.player1_blocks === 'string' ? JSON.parse(raw.player1_blocks) : raw.player1_blocks,
    player2_blocks: typeof raw.player2_blocks === 'string' ? JSON.parse(raw.player2_blocks) : raw.player2_blocks,
    player1_score: raw.player1_score,
    player2_score: raw.player2_score,
    player1_time_ms: raw.player1_time_ms,
    player2_time_ms: raw.player2_time_ms,
    move_number: raw.move_number,
    turn_started_at: raw.turn_started_at,
    winner_user_id: raw.winner_user_id,
    finished_reason: raw.finished_reason,
    updated_at: raw.updated_at,
    bulldog_positions: typeof raw.bulldog_positions === 'string'
      ? JSON.parse(raw.bulldog_positions)
      : (raw.bulldog_positions ?? []),
  };
}

// ── Matchmaking ─────────────────────────────────────────

/**
 * Quick match for turn mode: atomically find or create a turn match.
 */
export async function findOrCreateTurnMatch(userId: string): Promise<Match> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('claim_turn_match', {
    p_user_id: userId,
  });
  if (error) throw error;
  if (!data?.id) throw new Error('Could not find or create turn match');
  return getMatchWithPlayers(data.id);
}

/**
 * Create a private turn match with invite code.
 */
export async function createTurnInviteMatch(
  userId: string
): Promise<{ match: Match; inviteCode: string }> {
  const supabase = getSupabaseClient();
  let code = generateInviteCode();
  let attempts = 0;

  while (attempts < 10) {
    const seed = generateSeed();
    const { data: newMatch, error: matchErr } = await supabase
      .from('matches')
      .insert({
        status: 'waiting',
        mode: 'turn',
        seed,
        invite_code: code,
        time_limit_seconds: 300,
        created_by: userId,
      })
      .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
      .single();

    if (matchErr) {
      if (matchErr.code === '23505') {
        code = generateInviteCode();
        attempts++;
        continue;
      }
      throw matchErr;
    }

    const { error: playerErr } = await supabase.from('match_players').insert({
      match_id: newMatch.id,
      user_id: userId,
    });
    if (playerErr) throw playerErr;

    // Create initial turn_match_states row
    await supabase.from('turn_match_states').insert({
      match_id: newMatch.id,
      player1_user_id: userId,
      player2_user_id: userId, // placeholder until opponent joins
      current_turn_user_id: null,
      board: [],
      player1_blocks: [8, 8, 8, 8, 8],
      player2_blocks: [8, 8, 8, 8, 8],
      player1_score: 0,
      player2_score: 0,
      player1_time_ms: TURN_TIME_LIMIT_MS,
      player2_time_ms: TURN_TIME_LIMIT_MS,
      move_number: 0,
      bulldog_positions: [],
    });

    const match = await getMatchWithPlayers(newMatch.id);
    return { match, inviteCode: code };
  }
  throw new Error('Could not generate unique invite code');
}

/**
 * Join a turn match by invite code.
 */
export async function joinTurnByInviteCode(
  userId: string,
  code: string
): Promise<Match> {
  const normalized = String(code).trim().toUpperCase();
  if (normalized.length !== 6) throw new Error('Invite code must be 6 characters');

  const supabase = getSupabaseClient();
  const { data: matchRow, error: findErr } = await supabase
    .from('matches')
    .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
    .eq('invite_code', normalized)
    .eq('status', 'waiting')
    .eq('mode', 'turn')
    .single();
  if (findErr || !matchRow) throw new Error('Invalid or expired invite code');

  const { data: existing } = await supabase
    .from('match_players')
    .select('id')
    .eq('match_id', matchRow.id)
    .eq('user_id', userId)
    .single();
  if (existing) return getMatchWithPlayers(matchRow.id);

  const { error: insertErr } = await supabase.from('match_players').insert({
    match_id: matchRow.id,
    user_id: userId,
  });
  if (insertErr) throw insertErr;

  // Activate match
  await supabase
    .from('matches')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', matchRow.id);

  // Set player2 in turn_match_states
  const { data: stateRow } = await supabase
    .from('turn_match_states')
    .select('player1_user_id')
    .eq('match_id', matchRow.id)
    .single();

  if (stateRow) {
    await supabase
      .from('turn_match_states')
      .update({
        player2_user_id: userId,
        current_turn_user_id: stateRow.player1_user_id,
        turn_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchRow.id);
  }

  return getMatchWithPlayers(matchRow.id);
}

// ── State management ────────────────────────────────────

async function getMatchWithPlayers(matchId: string): Promise<Match> {
  const supabase = getSupabaseClient();
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
    .eq('id', matchId)
    .single();
  if (matchErr) throw matchErr;

  const { data: players, error: playersErr } = await supabase
    .from('match_players')
    .select('id, match_id, user_id, score, submitted_at, is_winner')
    .eq('match_id', matchId);
  if (playersErr) throw playersErr;

  return { ...match, match_players: players ?? [] };
}

/**
 * Fetch current turn match state.
 */
export async function getTurnMatchState(matchId: string): Promise<TurnMatchState | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('turn_match_states')
    .select('*')
    .eq('match_id', matchId)
    .single();
  if (error || !data) return null;
  return parseTurnState(data);
}

/**
 * Initialize the board from seed (called once when match becomes active).
 */
export async function initTurnBoard(matchId: string, seed: string): Promise<void> {
  const supabase = getSupabaseClient();
  const initial = createInitialState(seed);

  // Convert grid to a JSON-serializable 2D array
  const board = initial.grid.map((row) => [...row]);

  await supabase.rpc('init_turn_board', {
    p_match_id: matchId,
    p_board: board,
    p_bulldog_positions: initial.bulldogPositions,
    p_player1_blocks: initial.blockCounts.map((c) => Math.min(c, 8)),
    p_player2_blocks: initial.blockCounts.map((c) => Math.min(c, 8)),
  });
}

/**
 * Submit a move via RPC (server-authoritative).
 */
export async function submitTurnMove(
  matchId: string,
  userId: string,
  row: number,
  col: number,
  color: number,
  scoreDelta: number,
  timeSpentMs: number
): Promise<TurnMatchState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('submit_turn_move', {
    p_match_id: matchId,
    p_user_id: userId,
    p_row: row,
    p_col: col,
    p_color: color,
    p_score_delta: scoreDelta,
    p_time_spent_ms: timeSpentMs,
  });
  if (error) throw error;
  return parseTurnState(data);
}

/**
 * Forfeit a match.
 */
export async function forfeitTurnMatch(matchId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('forfeit_turn_match', {
    p_match_id: matchId,
    p_user_id: userId,
  });
  if (error) throw error;
}

/**
 * Subscribe to turn match state changes (real-time).
 * Returns unsubscribe function.
 */
export function subscribeToTurnState(
  matchId: string,
  callback: (state: TurnMatchState) => void
): () => void {
  const supabase = getSupabaseClient();
  let channel: RealtimeChannel;

  const refetch = async () => {
    const s = await getTurnMatchState(matchId);
    if (s) callback(s);
  };

  channel = supabase
    .channel(`turn_state:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'turn_match_states',
        filter: `match_id=eq.${matchId}`,
      },
      () => void refetch()
    )
    .subscribe();

  // Also poll as fallback
  const poll = setInterval(refetch, 3000);

  return () => {
    clearInterval(poll);
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch move history for a turn match.
 */
export async function getTurnMatchMoves(matchId: string): Promise<TurnMove[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('turn_match_moves')
    .select('*')
    .eq('match_id', matchId)
    .order('move_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TurnMove[];
}
