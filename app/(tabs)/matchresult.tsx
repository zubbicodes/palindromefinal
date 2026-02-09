import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import {
  acceptRematch,
  declineRematch,
  getMatch,
  requestRematch,
  subscribeToRematchRequests,
  type Match,
  type MatchPlayer,
  type RematchRequest,
} from '@/lib/matchmaking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchResultScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId: string; returnTo?: string }>();
  const matchId = typeof params.matchId === 'string' ? params.matchId : Array.isArray(params.matchId) ? params.matchId[0] : undefined;
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : Array.isArray(params.returnTo) ? params.returnTo[0] : undefined;
  const backTarget = returnTo === 'friends' ? '/friends' : '/multiplayer';
  const [match, setMatch] = useState<Match | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [rematchLoading, setRematchLoading] = useState(false);
  const [rematchRequest, setRematchRequest] = useState<RematchRequest | null>(null);
  const [requesterName, setRequesterName] = useState<string>('Opponent');
  const [declinedNotification, setDeclinedNotification] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);

  useEffect(() => {
    if (!matchId) {
      router.replace(backTarget);
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
    return () => { cancelled = true; };
  }, [matchId, router, backTarget]);

  useEffect(() => {
    if (!matchId) return;
    let unsub: (() => void) | null = null;
    authService.getSessionUser().then((user) => {
      if (!user) return;
      unsub = subscribeToRematchRequests(matchId, user.id, (req) => {
        if (req.to_user_id === user.id && req.status === 'pending') {
          setRematchRequest(req);
          authService.getProfile(req.from_user_id).then((profile) => {
            setRequesterName(profile?.full_name || 'Opponent');
          });
        } else if (req.from_user_id === user.id && req.status === 'declined') {
          setDeclinedNotification(true);
          setTimeout(() => router.replace(backTarget), 2000);
        } else if (req.status === 'accepted' && req.created_match_id) {
          if (req.from_user_id === user.id || req.to_user_id === user.id) {
            router.replace({ pathname: '/gamelayout', params: { matchId: req.created_match_id, ...(returnTo ? { returnTo } : {}) } });
          }
        }
      });
    });
    return () => unsub?.();
  }, [matchId, router, backTarget, returnTo]);

  const handleBackToLobby = useCallback(() => {
    router.replace(backTarget);
  }, [router, backTarget]);

  const handleRematch = useCallback(async () => {
    const user = await authService.getSessionUser();
    if (!user || !matchId) return;
    setRematchLoading(true);
    try {
      const result = await requestRematch(matchId, user.id);
      if (result.action === 'accepted' && result.match) {
        router.replace({ pathname: '/gamelayout', params: { matchId: result.match.id, ...(returnTo ? { returnTo } : {}) } });
      } else if (result.action === 'requested') {
        setRematchRequested(true);
      }
    } catch {
      // ignore
    } finally {
      setRematchLoading(false);
    }
  }, [matchId, router, returnTo]);

  const handleAcceptRematch = useCallback(async () => {
    if (!rematchRequest) return;
    setRematchLoading(true);
    try {
      const user = await authService.getSessionUser();
      if (!user) return;
      const result = await acceptRematch(rematchRequest.id, user.id);
      setRematchRequest(null);
      if (result.match) {
        router.replace({ pathname: '/gamelayout', params: { matchId: result.match.id, ...(returnTo ? { returnTo } : {}) } });
      }
    } catch {
      // ignore
    } finally {
      setRematchLoading(false);
    }
  }, [rematchRequest, router, returnTo]);

  const handleDeclineRematch = useCallback(async () => {
    if (!rematchRequest) return;
    try {
      const user = await authService.getSessionUser();
      if (!user) return;
      await declineRematch(rematchRequest.id, user.id);
      setRematchRequest(null);
    } catch {
      // ignore
    }
  }, [rematchRequest]);

  if (!matchId) return null;

  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';
  const cardBg = isDark ? 'rgba(25,25,91,0.6)' : 'rgba(255,255,255,0.9)';

  return (
    <LinearGradient
      colors={isDark ? ['#0a0a1c', '#16162e'] : ['#f0f4ff', '#e8ecf8']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Text style={[styles.title, { color: text }]}>Match Result</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} />
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

              {declinedNotification && (
                <View style={[styles.toast, { backgroundColor: isDark ? 'rgba(239,68,68,0.9)' : 'rgba(220,38,38,0.9)' }]}>
                  <Text style={styles.toastText}>Opponent declined your rematch request</Text>
                </View>
              )}
              {rematchRequest && (
                <View style={[styles.rematchPopup, { backgroundColor: cardBg }]}>
                  <Text style={[styles.rematchPopupTitle, { color: text }]}>{requesterName} wants a rematch</Text>
                  <View style={styles.rematchPopupButtons}>
                    <Pressable
                      onPress={handleAcceptRematch}
                      disabled={rematchLoading}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        styles.rematchPopupBtn,
                        { opacity: rematchLoading ? 0.7 : pressed ? 0.9 : 1 },
                      ]}
                    >
                      <LinearGradient colors={['#1177FE', '#48B7FF']} style={StyleSheet.absoluteFill} />
                      {rematchLoading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Accept</Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={handleDeclineRematch}
                      disabled={rematchLoading}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        styles.rematchPopupBtn,
                        { borderColor: isDark ? 'rgba(239,68,68,0.8)' : '#dc2626', opacity: pressed ? 0.9 : 1 },
                      ]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>Decline</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {rematchRequested && (
                <View style={[styles.toast, { backgroundColor: isDark ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,0.9)' }]}>
                  <Text style={styles.toastText}>Waiting for opponent to accept...</Text>
                </View>
              )}
              <View style={styles.buttons}>
                <Pressable
                  onPress={handleRematch}
                  disabled={rematchLoading || rematchRequested}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { opacity: rematchLoading || rematchRequested ? 0.7 : pressed ? 0.9 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={['#1177FE', '#48B7FF']}
                    style={StyleSheet.absoluteFill}
                  />
                  {rematchLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{rematchRequested ? 'Waiting...' : 'Rematch'}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleBackToLobby}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: colors.accent, opacity: pressed ? 0.9 : 1 },
                  ]}
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
    overflow: 'hidden',
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
  toast: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  toastText: { fontFamily: 'Geist-Bold', fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
  rematchPopup: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  rematchPopupTitle: { fontFamily: 'Geist-Bold', fontSize: 16, marginBottom: 14, textAlign: 'center' },
  rematchPopupButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  rematchPopupBtn: { flex: 1, minWidth: 0 },
});
