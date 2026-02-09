import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { findOrCreateQuickMatch, getRecentMatches, type Match } from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GameMode = 'race' | 'turn' | 'aggressive';

export default function MultiplayerLobbyScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const [userId, setUserId] = useState<string | null>(null);
  const [raceLoading, setRaceLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await authService.getSessionUser();
      if (cancelled) return;
      if (user) {
        setUserId(user.id);
        try {
          const list = await getRecentMatches(user.id, 15);
          if (!cancelled) setRecentMatches(list);
          for (const m of list) {
            if (!m.match_players?.length) continue;
            const other = m.match_players.find((p) => p.user_id !== user.id);
            if (!other) continue;
            const profile = await authService.getProfile(other.user_id);
            if (cancelled) return;
            setOpponentNames((prev) => ({
              ...prev,
              [m.id]: profile?.full_name || profile?.username || 'Opponent',
            }));
          }
        } catch {
          // ignore
        } finally {
          if (!cancelled) setRecentLoading(false);
        }
      } else {
        setRecentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 1800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showComingSoon = useCallback(() => {
    setToastMessage('Coming Soon');
  }, []);

  const handleRaceMode = useCallback(async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to play online.');
      return;
    }
    setRaceLoading(true);
    try {
      const match = await findOrCreateQuickMatch(userId);
      if (match.status === 'active') {
        router.replace({ pathname: '/gamelayout', params: { matchId: match.id } });
      } else {
        router.replace({ pathname: '/matchwaiting', params: { matchId: match.id } });
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message ?? 'Could not find or create match.');
    } finally {
      setRaceLoading(false);
    }
  }, [userId]);

  const goBack = useCallback(() => router.back(), []);

  const openRecentMatch = useCallback((match: Match) => {
    if (match.status === 'finished') {
      router.push({ pathname: '/matchresult', params: { matchId: match.id } });
    }
  }, []);

  const getResultForMatch = useCallback(
    (match: Match): string => {
      if (match.status !== 'finished' || !userId || !match.match_players?.length) return '—';
      const me = match.match_players.find((p) => p.user_id === userId);
      const other = match.match_players.find((p) => p.user_id !== userId);
      if (!me || !other) return '—';
      if (me.is_winner) return 'Won';
      if (other.is_winner) return 'Lost';
      return 'Draw';
    },
    [userId]
  );

  const cardBg = isDark ? 'rgba(25,25,91,0.6)' : 'rgba(255,255,255,0.9)';
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  const modes: { key: GameMode; title: string; subtitle: string; description: string; icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; onPress: () => void; loading?: boolean }[] = [
    {
      key: 'race',
      title: 'Race mode',
      subtitle: 'Match with a random opponent',
      description: 'Same board for both. Score as high as you can before time runs out—highest score wins.',
      icon: 'flash',
      gradient: ['#1177FE', '#48B7FF'],
      onPress: handleRaceMode,
      loading: raceLoading,
    },
    {
      key: 'turn',
      title: 'Turn mode',
      subtitle: 'Coming soon',
      description: 'Take turns on the same board. You go, they go—alternating play for a different kind of challenge.',
      icon: 'swap-horizontal',
      gradient: ['#6b7280', '#9ca3af'],
      onPress: showComingSoon,
    },
    {
      key: 'aggressive',
      title: 'Aggressive mode',
      subtitle: 'Coming soon',
      description: 'Faster pace, higher stakes. Same race rules with a twist—landing soon.',
      icon: 'flame',
      gradient: ['#6b7280', '#9ca3af'],
      onPress: showComingSoon,
    },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#0a0a1c', '#16162e'] : ['#f0f4ff', '#e8ecf8']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Play Online</Text>
          <View style={styles.backBtn} />
        </View>

        <Text style={[styles.subtitle, { color: muted }]}>Choose a game mode</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {modes.map((mode) => (
            <Pressable
              key={mode.key}
              onPress={mode.loading ? undefined : mode.onPress}
              disabled={!!mode.loading}
              style={({ pressed }) => [
                styles.modeCard,
                { backgroundColor: cardBg, opacity: mode.loading ? 0.8 : pressed ? 0.95 : 1 },
              ]}
            >
              <View style={[styles.modeIconWrap, { backgroundColor: mode.gradient[0] + '33' }]}>
                <Ionicons name={mode.icon} size={28} color={mode.gradient[0]} />
              </View>
              <View style={styles.modeTextWrap}>
                <Text style={[styles.modeTitle, { color: text }]}>{mode.title}</Text>
                <Text style={[styles.modeSubtitle, { color: muted }]}>{mode.subtitle}</Text>
                <Text style={[styles.modeDescription, { color: muted }]} numberOfLines={2}>
                  {mode.description}
                </Text>
              </View>
              {mode.loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="chevron-forward" size={22} color={muted} />
              )}
            </Pressable>
          ))}

          <View style={[styles.recentSection, { marginTop: 24 }]}>
            <Text style={[styles.recentSectionTitle, { color: text }]}>Recent games</Text>
            {recentLoading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
            ) : recentMatches.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: muted }]}>No recent games. Play a match to see history here.</Text>
            ) : (
              recentMatches.slice(0, 15).map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => openRecentMatch(m)}
                  style={({ pressed }) => [
                    styles.recentRow,
                    { backgroundColor: cardBg, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View style={styles.recentRowLeft}>
                    <Text style={[styles.recentOpponent, { color: text }]} numberOfLines={1}>
                      vs {opponentNames[m.id] ?? 'Opponent'}
                    </Text>
                    <Text style={[styles.recentDate, { color: muted }]}>
                      {new Date(m.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: m.created_at > new Date(Date.now() - 86400000 * 365).toISOString() ? undefined : 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.recentRowRight}>
                    <View style={[styles.resultBadge, { backgroundColor: getResultForMatch(m) === 'Won' ? 'rgba(34,197,94,0.2)' : getResultForMatch(m) === 'Lost' ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.08)' }]}>
                      <Text
                        style={[
                          styles.resultBadgeText,
                          {
                            color: getResultForMatch(m) === 'Won' ? '#22c55e' : getResultForMatch(m) === 'Lost' ? '#ef4444' : muted,
                          },
                        ]}
                      >
                        {getResultForMatch(m)}
                      </Text>
                    </View>
                    {m.status === 'finished' && (
                      <Ionicons name="chevron-forward" size={18} color={muted} />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>

        {toastMessage ? (
          <View style={[styles.toast, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.75)' }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Geist-Bold', fontSize: 20 },
  subtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  modeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modeTextWrap: { flex: 1, minWidth: 0 },
  modeTitle: { fontFamily: 'Geist-Bold', fontSize: 17, marginBottom: 2 },
  modeSubtitle: { fontFamily: 'Geist-Regular', fontSize: 13, marginBottom: 4 },
  modeDescription: { fontFamily: 'Geist-Regular', fontSize: 12, lineHeight: 17, opacity: 0.9 },
  recentSection: { paddingHorizontal: 0 },
  recentSectionTitle: { fontFamily: 'Geist-Bold', fontSize: 18, marginBottom: 12 },
  recentEmpty: { fontFamily: 'Geist-Regular', fontSize: 14, marginVertical: 12 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  recentRowLeft: { flex: 1, minWidth: 0 },
  recentOpponent: { fontFamily: 'Geist-Bold', fontSize: 15, marginBottom: 2 },
  recentDate: { fontFamily: 'Geist-Regular', fontSize: 12 },
  recentRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resultBadgeText: { fontFamily: 'Geist-Bold', fontSize: 12 },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { fontFamily: 'Geist-Bold', fontSize: 14, color: '#FFFFFF' },
});
