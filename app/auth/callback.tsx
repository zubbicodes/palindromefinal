import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  const { theme } = useThemeContext();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorDescription =
      typeof params.error_description === 'string' ? params.error_description : null;
    const errorParam = typeof params.error === 'string' ? params.error : null;

    if (errorDescription || errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    void (async () => {
      const url =
        typeof window !== 'undefined'
          ? window.location.href
          : `https://localhost/auth/callback?code=${encodeURIComponent(String(params.code || ''))}`;

      const result = await authService.completeOAuthRedirect(url);
      if (result.success) {
        router.replace('/gamelayout');
      } else {
        setError(result.error || 'Failed to complete sign in');
      }
    })();
  }, [params.code, params.error, params.error_description]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: theme === 'dark' ? '#000017' : '#FFFFFF',
      }}
    >
      {error ? (
        <Text
          style={{
            color: theme === 'dark' ? '#FFFFFF' : '#111111',
            fontFamily: 'Geist-Regular',
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
      ) : (
        <ActivityIndicator size="large" color={theme === 'dark' ? '#FFFFFF' : '#0060FF'} />
      )}
    </View>
  );
}
