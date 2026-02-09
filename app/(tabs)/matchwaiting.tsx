import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { getMatch, leaveMatch, subscribeToMatch, type Match } from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchWaitingScreen() {
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
        router.replace({ pathname: '/gamelayout', params: { matchId: m.id } });
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
          router.replace({ pathname: '/gamelayout', params: { matchId: m.id } });
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
      Alert.alert('Error', 'Could not leave match.');
    } finally {
      setLeaving(false);
    }
  }, [matchId, router, backTarget]);

  const goBack = useCallback(() => {
    Alert.alert(
      'Leave match?',
      'If you leave, the match will be cancelled.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: handleCancel },
      ]
    );
  }, [handleCancel]);

  const displayCode = (inviteCodeParam ?? inviteCodeFromMatch ?? match?.invite_code ?? '').toString().toUpperCase();
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  if (!matchId) return null;

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
          <Text style={[styles.title, { color: text }]}>Waiting for opponent</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 16 }} />
              <Text style={[styles.waitingText, { color: text }]}>
                Waiting for opponent...
              </Text>
              {displayCode ? (
                <View style={styles.codeBox}>
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
            onPress={goBack}
            disabled={leaving}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.accent, opacity: leaving ? 0.6 : pressed ? 0.9 : 1 },
            ]}
          >
            {leaving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.cancelBtnText, { color: colors.accent }]}>Cancel</Text>
            )}
          </Pressable>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.06)',
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
