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
      let url = typeof window !== 'undefined' ? window.location.href : '';

      if (!url) {
        // Construct URL from params if we are on native and deep linked
        const base = 'https://localhost/auth/callback';
        const query = new URLSearchParams();
        if (params.code) query.append('code', String(params.code));
        if (params.access_token) query.append('access_token', String(params.access_token));
        if (params.refresh_token) query.append('refresh_token', String(params.refresh_token));
        if (params.error) query.append('error', String(params.error));
        if (params.error_description) query.append('error_description', String(params.error_description));
        
        // Only construct if we have relevant params
        if (query.toString()) {
           url = `${base}?${query.toString()}`;
        }
      }

      if (url) {
        const result = await authService.completeOAuthRedirect(url);
        if (result.success) {
          router.replace('/gamelayout');
        } else {
          setError(result.error || 'Failed to complete sign in');
        }
      } else {
         // If no URL and no params, we might just be waiting or loaded incorrectly
         // But we shouldn't error immediately if it's just mounting
      }
    })();
  }, [params.code, params.access_token, params.refresh_token, params.error, params.error_description]);

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
