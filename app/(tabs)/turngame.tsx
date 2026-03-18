import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';

/**
 * Fallback turngame screen for native platforms.
 * Turn-based multiplayer is currently web-only.
 */
export default function TurnGameNative() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to multiplayer lobby on native since turn game is web-only
    const timer = setTimeout(() => router.replace('/multiplayer'), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Turn mode is available on web only.</Text>
      <Text style={styles.sub}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1c' },
  text: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
