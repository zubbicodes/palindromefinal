/**
 * Matchmaking service for Async Race multiplayer.
 * Quick match, invite codes, real-time subscriptions, and score submission.
 */

import { getSupabaseClient } from '@/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TIME_LIMIT_SECONDS = 180;

export interface MatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  score: number | null;
  submitted_at: string | null;
  is_winner: boolean | null;
}

export interface Match {
  id: string;
  created_at: string;
  status: 'waiting' | 'active' | 'finished';
  mode: string;
  seed: string;
  invite_code: string | null;
  time_limit_seconds: number;
  started_at: string | null;
  finished_at: string | null;
  match_players?: MatchPlayer[];
}

const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O, 1/I

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

/**
 * Quick match: find an existing waiting match without invite code, or create one.
 */
export async function findOrCreateQuickMatch(userId: string): Promise<Match> {
  const supabase = getSupabaseClient();

  const { data: existing } = await supabase
    .from('matches')
    .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
    .eq('status', 'waiting')
    .is('invite_code', null)
    .limit(1)
    .single();

  if (existing) {
    const { error: insertErr } = await supabase.from('match_players').insert({
      match_id: existing.id,
      user_id: userId,
    });
    if (insertErr) throw insertErr;

    const { error: updateErr } = await supabase
      .from('matches')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (updateErr) throw updateErr;

    return getMatchWithPlayers(existing.id);
  }

  const seed = generateSeed();
  const { data: newMatch, error: matchErr } = await supabase
    .from('matches')
    .insert({
      status: 'waiting',
      mode: 'race',
      seed,
      invite_code: null,
      time_limit_seconds: TIME_LIMIT_SECONDS,
    })
    .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
    .single();
  if (matchErr) throw matchErr;

  const { error: playerErr } = await supabase.from('match_players').insert({
    match_id: newMatch.id,
    user_id: userId,
  });
  if (playerErr) throw playerErr;

  return getMatchWithPlayers(newMatch.id);
}

/**
 * Create a private match with an invite code.
 */
export async function createInviteMatch(
  userId: string
): Promise<{ match: Match; inviteCode: string }> {
  const supabase = getSupabaseClient();
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const seed = generateSeed();
    const { data: newMatch, error: matchErr } = await supabase
      .from('matches')
      .insert({
        status: 'waiting',
        mode: 'race',
        seed,
        invite_code: code,
        time_limit_seconds: TIME_LIMIT_SECONDS,
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

    const match = await getMatchWithPlayers(newMatch.id);
    return { match, inviteCode: code };
  }

  throw new Error('Could not generate unique invite code');
}

/**
 * Join an existing match by 6-character invite code.
 */
export async function joinByInviteCode(
  userId: string,
  code: string
): Promise<Match> {
  const normalized = String(code).trim().toUpperCase();
  if (normalized.length !== 6) {
    throw new Error('Invite code must be 6 characters');
  }

  const supabase = getSupabaseClient();

  const { data: matchRow, error: findErr } = await supabase
    .from('matches')
    .select('id, created_at, status, mode, seed, invite_code, time_limit_seconds, started_at, finished_at')
    .eq('invite_code', normalized)
    .eq('status', 'waiting')
    .single();

  if (findErr || !matchRow) {
    throw new Error('Invalid or expired invite code');
  }

  const { data: existing } = await supabase
    .from('match_players')
    .select('id')
    .eq('match_id', matchRow.id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return getMatchWithPlayers(matchRow.id);
  }

  const { error: insertErr } = await supabase.from('match_players').insert({
    match_id: matchRow.id,
    user_id: userId,
  });
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('matches')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', matchRow.id);
  if (updateErr) throw updateErr;

  return getMatchWithPlayers(matchRow.id);
}

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
 * Fetch a single match with its players.
 */
export async function getMatch(matchId: string): Promise<Match | null> {
  try {
    return await getMatchWithPlayers(matchId);
  } catch {
    return null;
  }
}

/**
 * Subscribe to match and match_players changes (status, scores).
 * Returns an unsubscribe function.
 */
export function subscribeToMatch(
  matchId: string,
  callback: (match: Match) => void
): () => void {
  const supabase = getSupabaseClient();
  let channel: RealtimeChannel;

  const refetch = async () => {
    const m = await getMatch(matchId);
    if (m) callback(m);
  };

  channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      () => {
        void refetch();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_players',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        void refetch();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Submit final score for the current user. Call when time is up or game ends.
 */
export async function submitScore(
  matchId: string,
  userId: string,
  score: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: row } = await supabase
    .from('match_players')
    .select('id, submitted_at')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .single();

  if (!row) throw new Error('Not a participant in this match');
  if (row.submitted_at) return;

  const { error } = await supabase
    .from('match_players')
    .update({
      score,
      submitted_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('user_id', userId);

  if (error) throw error;

  const { data: players } = await supabase
    .from('match_players')
    .select('submitted_at')
    .eq('match_id', matchId);

  const allSubmitted =
    players?.length === 2 && players.every((p) => p.submitted_at != null);
  if (allSubmitted) {
    const full = await getMatchWithPlayers(matchId);
    const withScores = (full.match_players ?? []).filter((p) => p.score != null);
    const [p1, p2] = withScores;
    const p1Winner = p1 && p2 ? (p1.score! > p2.score!) : false;
    const p2Winner = p1 && p2 ? (p2.score! > p1.score!) : false;

    for (const p of full.match_players ?? []) {
      const isWinner =
        p.user_id === p1?.user_id ? p1Winner : p.user_id === p2?.user_id ? p2Winner : false;
      await supabase
        .from('match_players')
        .update({ is_winner: isWinner })
        .eq('id', p.id);
    }

    await supabase
      .from('matches')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', matchId);
  }
}

/**
 * Mark match as finished (e.g. time expired). Used when both players have submitted.
 */
export async function finishMatch(matchId: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from('matches')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', matchId);
}

/**
 * Leave/cancel a match (e.g. while waiting). Removes the user from match_players.
 */
export async function leaveMatch(matchId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('match_players')
    .delete()
    .eq('match_id', matchId)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Fetch recent matches for the current user (for lobby "Recent" list).
 */
export async function getRecentMatches(userId: string, limit = 10): Promise<Match[]> {
  const supabase = getSupabaseClient();

  const { data: playerRows } = await supabase
    .from('match_players')
    .select('match_id')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!playerRows?.length) return [];

  const matchIds = [...new Set(playerRows.map((r) => r.match_id))];
  const results: Match[] = [];

  for (const id of matchIds.slice(0, limit)) {
    const m = await getMatch(id);
    if (m) results.push(m);
  }

  results.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return results.slice(0, limit);
}
