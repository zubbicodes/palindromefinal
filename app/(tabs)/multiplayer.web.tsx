'use client';

import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { findOrCreateQuickMatch, getRecentMatches, type Match } from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
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
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

type GameMode = 'race' | 'turn' | 'aggressive';

const BREAKPOINT_TWO_COL = 900;

export default function MultiplayerLobbyWebScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const [userId, setUserId] = useState<string | null>(null);
  const [raceLoading, setRaceLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const showComingSoon = useCallback(() => setToastMessage('Coming Soon'), []);

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
      const myScore = me.score != null ? me.score : null;
      const theirScore = other.score != null ? other.score : null;
      if (myScore !== null && theirScore !== null) {
        if (myScore > theirScore) return 'Won';
        if (theirScore > myScore) return 'Lost';
        return 'Draw';
      }
      if (me.is_winner) return 'Won';
      if (other.is_winner) return 'Lost';
      return 'Draw';
    },
    [userId]
  );

  const cardBg = isDark ? 'rgba(25,25,91,0.6)' : 'rgba(255,255,255,0.9)';
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';
  const twoColumn = windowWidth >= BREAKPOINT_TWO_COL;

  const modes: {
    key: GameMode;
    title: string;
    subtitle: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    onPress: () => void;
    loading?: boolean;
  }[] = [
    {
      key: 'race',
      title: 'Race mode',
      subtitle: 'Match with a random opponent',
      description: 'Same puzzle for both. Score as high as you can before time runs out—highest score wins.',
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
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Play Online</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: twoColumn ? 'row' : 'column',
              gap: twoColumn ? 24 : 0,
              padding: 16,
              paddingTop: 8,
              maxWidth: twoColumn ? 1200 : 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '100%',
              alignItems: twoColumn ? 'stretch' : undefined,
            }}
          >
            <div
              style={{
                flex: twoColumn ? '0 0 380px' : undefined,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Text style={[styles.subtitle, { color: muted }]}>Choose a game mode</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {modes.map((mode) => (
                <Pressable
                  key={mode.key}
                  onPress={mode.loading ? undefined : mode.onPress}
                  disabled={!!mode.loading}
                  style={({ pressed }) => [
                    styles.modeCard,
                    { backgroundColor: cardBg, opacity: mode.loading ? 0.8 : pressed ? 0.95 : 1 },
                  ] as StyleProp<ViewStyle>}
                >
                  <View style={[styles.modeIconWrap, { backgroundColor: mode.gradient[0] + '33' }] as StyleProp<ViewStyle>}>
                    <Ionicons name={mode.icon} size={28} color={mode.gradient[0]} />
                  </View>
                  <View style={styles.modeTextWrap}>
                    <Text style={[styles.modeTitle, { color: text }] as StyleProp<TextStyle>}>{mode.title}</Text>
                    <Text style={[styles.modeSubtitle, { color: muted }] as StyleProp<TextStyle>}>{mode.subtitle}</Text>
                    <Text style={[styles.modeDescription, { color: muted }] as StyleProp<TextStyle>} numberOfLines={2}>
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
            </div>
          </div>

          <div
            style={{
              flex: twoColumn ? 1 : undefined,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              marginTop: twoColumn ? 0 : 24,
            }}
          >
            <Text style={[styles.recentSectionTitle, { color: text }] as StyleProp<TextStyle>}>Recent games</Text>
            {recentLoading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
            ) : recentMatches.length === 0 ? (
              <Text style={[styles.recentEmpty, { color: muted }] as StyleProp<TextStyle>}>
                No recent games. Play a match to see history here.
              </Text>
            ) : (
              <ScrollView
                style={styles.recentScroll as StyleProp<ViewStyle>}
                contentContainerStyle={styles.recentScrollContent as StyleProp<ViewStyle>}
                showsVerticalScrollIndicator={true}
              >
                {recentMatches.slice(0, 15).map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => openRecentMatch(m)}
                    style={({ pressed }) => [
                      styles.recentRow,
                      { backgroundColor: cardBg, opacity: pressed ? 0.9 : 1 },
                    ] as StyleProp<ViewStyle>}
                  >
                    <View style={styles.recentRowLeft as StyleProp<ViewStyle>}>
                      <Text style={[styles.recentOpponent, { color: text }] as StyleProp<TextStyle>} numberOfLines={1}>
                        vs {opponentNames[m.id] ?? 'Opponent'}
                      </Text>
                      <Text style={[styles.recentDate, { color: muted }] as StyleProp<TextStyle>}>
                        {new Date(m.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year:
                            m.created_at > new Date(Date.now() - 86400000 * 365).toISOString()
                              ? undefined
                              : 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.recentRowRight as StyleProp<ViewStyle>}>
                      <View
                        style={[
                          styles.resultBadge,
                          {
                            backgroundColor:
                              getResultForMatch(m) === 'Won'
                                ? 'rgba(34,197,94,0.2)'
                                : getResultForMatch(m) === 'Lost'
                                  ? 'rgba(239,68,68,0.2)'
                                  : 'rgba(0,0,0,0.08)',
                          },
                        ] as StyleProp<ViewStyle>}
                      >
                        <Text
                          style={[
                            styles.resultBadgeText,
                            {
                              color:
                                getResultForMatch(m) === 'Won'
                                  ? '#22c55e'
                                  : getResultForMatch(m) === 'Lost'
                                    ? '#ef4444'
                                    : muted,
                            },
                          ] as StyleProp<TextStyle>}
                        >
                          {getResultForMatch(m)}
                        </Text>
                      </View>
                      {m.status === 'finished' && (
                        <Ionicons name="chevron-forward" size={18} color={muted} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </div>
          </div>
        </ScrollView>

        {toastMessage ? (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 24px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.85)',
              color: '#FFFFFF',
              fontFamily: 'Geist-Bold, system-ui',
              fontSize: 14,
            }}
          >
            {toastMessage}
          </div>
        ) : null}
      </View>
    </div>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, paddingTop: 48, paddingBottom: 24, display: 'flex', flexDirection: 'column' },
  mainScroll: { flex: 1, minHeight: 0 },
  mainScrollContent: { paddingBottom: 24 },
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
    marginBottom: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
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
  recentSectionTitle: { fontFamily: 'Geist-Bold', fontSize: 18, marginBottom: 12 },
  recentEmpty: { fontFamily: 'Geist-Regular', fontSize: 14, marginVertical: 12 },
  recentScroll: { flex: 1, minHeight: 0 },
  recentScrollContent: { paddingBottom: 24, gap: 0 },
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
});
