import { getSupabaseClient } from '@/supabase';

export type SinglePlayerBestRow = {
  user_id: string;
  best_score: number;
  best_time_seconds: number;
  updated_at: string;
};

export type LeaderboardRow = {
  user_id: string;
  best_score: number;
  best_time_seconds: number;
  profile?: { full_name: string | null; avatar_url: string | null; username: string | null };
};

export async function saveSinglePlayerRun(
  userId: string,
  score: number,
  timeSeconds: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('single_player_runs').insert({
    user_id: userId,
    score: Math.max(0, Math.floor(score)),
    time_seconds: Math.max(0, Math.floor(timeSeconds)),
  });
  if (error) throw error;
}

export async function getMyBestSinglePlayer(userId: string): Promise<SinglePlayerBestRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('single_player_best')
    .select('user_id, best_score, best_time_seconds, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as SinglePlayerBestRow) ?? null;
}

export async function getSinglePlayerLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('single_player_best')
    .select('user_id, best_score, best_time_seconds, profiles(full_name, avatar_url, username)')
    .order('best_score', { ascending: false })
    .order('best_time_seconds', { ascending: true })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    user_id: r.user_id,
    best_score: r.best_score,
    best_time_seconds: r.best_time_seconds,
    profile: r.profiles ?? undefined,
  }));
}

