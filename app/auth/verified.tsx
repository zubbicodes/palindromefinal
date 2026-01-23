import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Status = 'checking' | 'ready' | 'error';

export default function EmailVerifiedScreen() {
  const { theme, colors } = useThemeContext();
  const params = useLocalSearchParams();

  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const payload = useMemo(() => {
    const fromParams = {
      code: typeof params.code === 'string' ? params.code : null,
      access_token: typeof params.access_token === 'string' ? params.access_token : null,
      refresh_token: typeof params.refresh_token === 'string' ? params.refresh_token : null,
    };

    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return { url: '', hasAuthPayload: Boolean(fromParams.code || (fromParams.access_token && fromParams.refresh_token)) };

    try {
      const u = new URL(url);
      const query = u.searchParams;
      const hashParams = new URLSearchParams(u.hash.startsWith('#') ? u.hash.slice(1) : u.hash);

      const code = query.get('code') || hashParams.get('code');
      const access_token = hashParams.get('access_token') || query.get('access_token');
      const refresh_token = hashParams.get('refresh_token') || query.get('refresh_token');

      const hasAuthPayload = Boolean(code || (access_token && refresh_token));
      return { url, hasAuthPayload };
    } catch {
      return { url, hasAuthPayload: false };
    }
  }, [params.code, params.access_token, params.refresh_token]);

  useEffect(() => {
    void (async () => {
      if (!payload.hasAuthPayload) {
        setStatus('ready');
        return;
      }

      const url =
        payload.url ||
        (() => {
          const base = 'https://localhost/auth/verified';
          const query = new URLSearchParams();
          if (params.code) query.append('code', String(params.code));
          if (params.access_token) query.append('access_token', String(params.access_token));
          if (params.refresh_token) query.append('refresh_token', String(params.refresh_token));
          return `${base}?${query.toString()}`;
        })();

      const result = await authService.completeOAuthRedirect(url);
      if (result.success) {
        setSignedIn(true);
        setStatus('ready');
        return;
      }

      if (result.error === 'Missing auth code') {
        setStatus('ready');
        return;
      }

      setError(result.error || 'Unable to verify this link');
      setStatus('error');
    })();
  }, [params.access_token, params.code, params.refresh_token, payload.hasAuthPayload, payload.url]);

  const title = status === 'error' ? 'Verification issue' : 'Email verified';
  const message =
    status === 'error'
      ? error || 'Unable to verify this link.'
      : signedIn
        ? 'Your email is verified and you are signed in. You can continue to the game.'
        : 'Your email is verified. You can now log in to the game.';

  const primaryLabel = signedIn ? 'Continue to game' : 'Go to login';

  const handlePrimary = () => {
    router.replace(signedIn ? '/main' : '/');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' ? '#000017' : '#FFFFFF',
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          {status === 'checking' ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Ionicons
              name={status === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={56}
              color={status === 'error' ? colors.error : colors.success}
            />
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.secondaryText }]}>{message}</Text>

        {status !== 'checking' ? (
          <Pressable
            onPress={handlePrimary}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.buttonPrimary,
                opacity: pressed ? 0.9 : 1,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : null),
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
              {primaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrap: {
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? ('Geist, sans-serif' as any) : 'Geist-Bold',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: Platform.OS === 'web' ? ('Geist, sans-serif' as any) : 'Geist-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Platform.OS === 'web' ? ('Geist, sans-serif' as any) : 'Geist-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
});
