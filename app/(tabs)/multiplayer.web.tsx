'use client';

import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import {
  createInviteMatch,
  findOrCreateQuickMatch,
  getRecentMatches,
  joinByInviteCode,
  type Match,
} from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function MultiplayerLobbyWebScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const [userId, setUserId] = useState<string | null>(null);
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await authService.getSessionUser();
      if (cancelled) return;
      if (user) {
        setUserId(user.id);
        const list = await getRecentMatches(user.id, 10);
        if (!cancelled) setRecentMatches(list);
      }
      if (!cancelled) setRecentLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateToMatch = useCallback(
    (match: Match, inviteCode?: string) => {
      if (match.status === 'active') {
        router.replace({
          pathname: '/gamelayout',
          params: { matchId: match.id },
        });
      } else {
        router.replace({
          pathname: '/matchwaiting',
          params: inviteCode
            ? { matchId: match.id, inviteCode }
            : { matchId: match.id },
        });
      }
    },
    []
  );

  const handleQuickMatch = useCallback(async () => {
    if (!userId) {
      setErrorMessage('Please sign in to play multiplayer.');
      return;
    }
    setErrorMessage(null);
    setQuickMatchLoading(true);
    try {
      const match = await findOrCreateQuickMatch(userId);
      navigateToMatch(match);
    } catch (e) {
      setErrorMessage((e as Error).message ?? 'Could not find or create match.');
    } finally {
      setQuickMatchLoading(false);
    }
  }, [userId, navigateToMatch]);

  const handleCreateInvite = useCallback(async () => {
    if (!userId) {
      setErrorMessage('Please sign in to create a match.');
      return;
    }
    setErrorMessage(null);
    setInviteLoading(true);
    try {
      const { match, inviteCode } = await createInviteMatch(userId);
      navigateToMatch(match, inviteCode);
    } catch (e) {
      setErrorMessage((e as Error).message ?? 'Could not create match.');
    } finally {
      setInviteLoading(false);
    }
  }, [userId, navigateToMatch]);

  const handleJoinByCode = useCallback(async () => {
    if (!userId) {
      setErrorMessage('Please sign in to join a match.');
      return;
    }
    const code = inviteCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setErrorMessage('Enter the 6-character invite code.');
      return;
    }
    setErrorMessage(null);
    setJoinLoading(true);
    try {
      const match = await joinByInviteCode(userId, code);
      navigateToMatch(match);
    } catch (e) {
      setErrorMessage((e as Error).message ?? 'Invalid or expired code.');
    } finally {
      setJoinLoading(false);
    }
  }, [userId, inviteCodeInput, navigateToMatch]);

  const openRecentMatch = useCallback((match: Match) => {
    if (match.status === 'finished') {
      router.push({
        pathname: '/matchresult',
        params: { matchId: match.id },
      });
    }
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, []);

  const bg = isDark ? '#0a0a1c' : '#f0f4ff';
  const cardBg = isDark ? 'rgba(25,25,91,0.6)' : 'rgba(255,255,255,0.9)';
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: bg, fontFamily: 'Geist-Regular, system-ui' }}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Multiplayer</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {errorMessage ? (
            <View style={[styles.card, { backgroundColor: cardBg, borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
              <Text style={{ color: '#ef4444', fontFamily: 'Geist-Regular', fontSize: 14 }}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: text }]}>Quick Match</Text>
            <Text style={[styles.cardSubtitle, { color: muted }]}>
              Play against a random opponent
            </Text>
            <Pressable
              onPress={handleQuickMatch}
              disabled={quickMatchLoading}
              style={[
                styles.primaryBtn,
                { opacity: quickMatchLoading ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {quickMatchLoading ? 'Finding match...' : 'Find Match'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: text }]}>Private Match</Text>
            <Text style={[styles.cardSubtitle, { color: muted }]}>
              Create a game and share the code with a friend
            </Text>
            <Pressable
              onPress={handleCreateInvite}
              disabled={inviteLoading}
              style={[styles.secondaryBtn, { borderColor: colors.accent, opacity: inviteLoading ? 0.7 : 1 }]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
                {inviteLoading ? 'Creating...' : 'Create & Get Code'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: text }]}>Join with Code</Text>
            <Text style={[styles.cardSubtitle, { color: muted }]}>
              Enter the 6-character code from your friend
            </Text>
            <View style={styles.joinRow}>
              <TextInput
                value={inviteCodeInput}
                onChangeText={(t) =>
                  setInviteCodeInput(t.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase())
                }
                placeholder="ABC123"
                placeholderTextColor={muted}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)',
                    color: text,
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
                maxLength={6}
                autoCapitalize="characters"
              />
              <Pressable
                onPress={handleJoinByCode}
                disabled={joinLoading || inviteCodeInput.trim().length !== 6}
                style={[
                  styles.joinBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: joinLoading || inviteCodeInput.trim().length !== 6 ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={styles.joinBtnText}>{joinLoading ? 'Joining...' : 'Join'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: text }]}>Recent Matches</Text>
            {recentLoading ? (
              <Text style={[styles.emptyText, { color: muted }]}>Loading...</Text>
            ) : recentMatches.length === 0 ? (
              <Text style={[styles.emptyText, { color: muted }]}>No recent matches</Text>
            ) : (
              recentMatches.slice(0, 10).map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => openRecentMatch(m)}
                  style={styles.recentRow}
                >
                  <Text style={[styles.recentStatus, { color: muted }]}>
                    {m.status === 'finished' ? 'Finished' : m.status}
                  </Text>
                  <Text style={[styles.recentDate, { color: muted }]}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </Text>
                  {m.status === 'finished' && (
                    <Ionicons name="chevron-forward" size={18} color={muted} />
                  )}
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
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
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Geist-Bold', fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, maxWidth: 480, alignSelf: 'center', width: '100%' },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontFamily: 'Geist-Bold', fontSize: 17, marginBottom: 4 },
  cardSubtitle: { fontFamily: 'Geist-Regular', fontSize: 13, marginBottom: 14 },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1177FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: 'Geist-Bold', fontSize: 16, color: '#FFFFFF' },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: 'Geist-Bold', fontSize: 16 },
  joinRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Geist-Regular',
    fontSize: 18,
    letterSpacing: 2,
  },
  joinBtn: {
    minWidth: 80,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: { fontFamily: 'Geist-Bold', fontSize: 16, color: '#FFFFFF' },
  emptyText: { fontFamily: 'Geist-Regular', fontSize: 14, marginVertical: 8 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 8,
  },
  recentStatus: { fontFamily: 'Geist-Regular', fontSize: 14, flex: 1 },
  recentDate: { fontFamily: 'Geist-Regular', fontSize: 12 },
});
