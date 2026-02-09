'use client';

import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { getMatch, leaveMatch, subscribeToMatch, type Match } from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MatchWaitingWebScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId: string; inviteCode?: string; returnTo?: string }>();
  const matchId = typeof params.matchId === 'string' ? params.matchId : Array.isArray(params.matchId) ? params.matchId[0] : undefined;
  const inviteCodeParam = typeof params.inviteCode === 'string' ? params.inviteCode : Array.isArray(params.inviteCode) ? params.inviteCode[0] : undefined;
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : Array.isArray(params.returnTo) ? params.returnTo[0] : undefined;
  const backTarget = returnTo === 'friends' ? '/friends' : '/multiplayer';
  const [match, setMatch] = useState<Match | null>(null);
  const [inviteCodeFromMatch, setInviteCodeFromMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!matchId) {
      router.replace(backTarget);
      return;
    }

    getMatch(matchId).then((m) => {
      if (m) {
        setMatch(m);
        if (m.invite_code) setInviteCodeFromMatch(m.invite_code);
      }
      setLoading(false);
    });

    unsubRef.current = subscribeToMatch(matchId, (m) => {
      setMatch(m);
      if (m.invite_code) setInviteCodeFromMatch(m.invite_code);
      if (m.status === 'active') {
        router.replace({ pathname: '/gamelayout', params: { matchId: m.id, ...(returnTo ? { returnTo } : {}) } });
      } else if (m.status === 'cancelled') {
        router.replace(backTarget);
      }
    });

    const poll = setInterval(async () => {
      const m = await getMatch(matchId);
      if (m) {
        setMatch(m);
        if (m.invite_code) setInviteCodeFromMatch(m.invite_code);
        if (m.status === 'active') {
          router.replace({ pathname: '/gamelayout', params: { matchId: m.id, ...(returnTo ? { returnTo } : {}) } });
        } else if (m.status === 'cancelled') {
          router.replace(backTarget);
        }
      }
    }, 2500);

    return () => {
      clearInterval(poll);
      unsubRef.current?.();
    };
  }, [matchId, router, backTarget]);

  const handleCancel = useCallback(async () => {
    if (!matchId) return;
    const user = await authService.getSessionUser();
    if (!user) {
      router.replace(backTarget);
      return;
    }
    setLeaving(true);
    try {
      await leaveMatch(matchId, user.id);
      router.replace(backTarget);
    } catch {
      // ignore
    } finally {
      setLeaving(false);
    }
  }, [matchId, router, backTarget]);

  const displayCode = (inviteCodeParam ?? inviteCodeFromMatch ?? match?.invite_code ?? '').toString().toUpperCase();
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  if (!matchId) return null;

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
          <Pressable onPress={handleCancel} style={styles.backBtn} accessibilityLabel="Cancel">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Waiting for opponent</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <Text style={{ color: muted }}>Connecting...</Text>
          ) : (
            <>
              <Text style={[styles.waitingText, { color: text }]}>
                Waiting for opponent...
              </Text>
              {displayCode ? (
                <View style={[styles.codeBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.codeLabel, { color: muted }]}>Invite code</Text>
                  <Text style={[styles.codeValue, { color: text }]} selectable>
                    {displayCode}
                  </Text>
                  <Text style={[styles.codeHint, { color: muted }]}>
                    Share this code with a friend to join
                  </Text>
                </View>
              ) : null}
            </>
          )}

          <Pressable
            onPress={handleCancel}
            disabled={leaving}
            style={[styles.cancelBtn, { borderColor: colors.accent, opacity: leaving ? 0.6 : 1 }]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.accent }]}>
              {leaving ? 'Leaving...' : 'Cancel'}
            </Text>
          </Pressable>
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
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Geist-Bold', fontSize: 18 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waitingText: { fontFamily: 'Geist-Regular', fontSize: 16, marginBottom: 24 },
  codeBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    minWidth: 200,
  },
  codeLabel: { fontFamily: 'Geist-Regular', fontSize: 12, marginBottom: 6 },
  codeValue: { fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: 4 },
  codeHint: { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 8 },
  cancelBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  cancelBtnText: { fontFamily: 'Geist-Bold', fontSize: 16 },
});
