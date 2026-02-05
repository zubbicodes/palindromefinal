'use client';

import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { createInviteMatch, getMatch, type Match, type MatchPlayer } from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MatchResultWebScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [rematchLoading, setRematchLoading] = useState(false);

  useEffect(() => {
    if (!matchId) {
      router.replace('/multiplayer');
      return;
    }
    let cancelled = false;
    (async () => {
      const m = await getMatch(matchId);
      if (cancelled) return;
      const user = await authService.getSessionUser();
      if (cancelled) return;
      setMatch(m ?? null);
      if (m?.match_players && user) {
        const me = m.match_players.find((p: MatchPlayer) => p.user_id === user.id);
        const other = m.match_players.find((p: MatchPlayer) => p.user_id !== user.id);
        setMyScore(me?.score ?? null);
        setOpponentScore(other?.score ?? null);
        setIsWinner(me?.is_winner ?? null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true };
  }, [matchId, router]);

  const handleBackToLobby = useCallback(() => {
    router.replace('/multiplayer');
  }, [router]);

  const handleRematch = useCallback(async () => {
    const user = await authService.getSessionUser();
    if (!user || !match?.match_players?.length) return;
    setRematchLoading(true);
    try {
      const { match: newMatch, inviteCode } = await createInviteMatch(user.id);
      router.replace({
        pathname: '/matchwaiting',
        params: { matchId: newMatch.id, inviteCode },
      });
    } catch {
      // ignore
    } finally {
      setRematchLoading(false);
    }
  }, [match, router]);

  if (!matchId) return null;

  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        background: isDark ? '#0a0a1c' : '#f0f4ff',
        fontFamily: 'Geist-Regular, system-ui',
      }}
    >
      <View style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Text style={[styles.title, { color: text }]}>Match Result</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <Text style={{ color: muted }}>Loading...</Text>
          ) : match ? (
            <>
              <Text style={[styles.resultTitle, { color: text }]}>
                {isWinner === true ? 'You won!' : isWinner === false ? 'You lost' : 'Match Complete'}
              </Text>

              <View style={styles.scoresRow}>
                <View style={styles.scoreCard}>
                  <Text style={[styles.scoreLabel, { color: muted }]}>You</Text>
                  <Text style={[styles.scoreValue, { color: colors.accent }]}>
                    {myScore ?? '—'}
                  </Text>
                </View>
                <View style={styles.scoreCard}>
                  <Text style={[styles.scoreLabel, { color: muted }]}>Opponent</Text>
                  <Text style={[styles.scoreValue, { color: text }]}>
                    {opponentScore ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.buttons}>
                <Pressable
                  onPress={handleRematch}
                  disabled={rematchLoading}
                  style={[styles.primaryBtn, { opacity: rematchLoading ? 0.7 : 1 }]}
                >
                  <Text style={styles.primaryBtnText}>
                    {rematchLoading ? 'Creating...' : 'Rematch'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleBackToLobby}
                  style={[styles.secondaryBtn, { borderColor: colors.accent }]}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
                    Back to Lobby
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={[styles.errorText, { color: muted }]}>Could not load result.</Text>
          )}
        </View>
      </View>
    </div>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: 48, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40 },
  title: { fontFamily: 'Geist-Bold', fontSize: 20 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultTitle: { fontFamily: 'Geist-Bold', fontSize: 22, marginBottom: 32 },
  scoresRow: { flexDirection: 'row', gap: 24, marginBottom: 40 },
  scoreCard: {
    minWidth: 120,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  scoreLabel: { fontFamily: 'Geist-Regular', fontSize: 14, marginBottom: 8 },
  scoreValue: { fontFamily: 'Geist-Bold', fontSize: 36 },
  buttons: { gap: 12, width: '100%', maxWidth: 280 },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1177FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: 'Geist-Bold', fontSize: 17, color: '#FFFFFF' },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: 'Geist-Bold', fontSize: 17 },
  errorText: { fontFamily: 'Geist-Regular', fontSize: 16 },
});
