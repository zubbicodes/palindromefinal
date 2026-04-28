import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const muted = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.68)';

  return (
    <LinearGradient colors={isDark ? ['#0a0a1c', '#16162e'] : ['#f8fbff', '#eef2ff']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Privacy Policy</Text>
          <View style={styles.backBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.updated, { color: muted }]}>Placeholder policy. Last updated April 28, 2026.</Text>
          <Text style={[styles.body, { color: muted }]}>
            Palindrome collects account details you provide, gameplay activity, preferences, and basic device/app diagnostics needed to run the game. Authentication and game data are stored with Supabase.
          </Text>
          <Text style={[styles.body, { color: muted }]}>
            We use this information to provide multiplayer matchmaking, scores, profiles, settings, support, and abuse prevention. We do not sell personal information.
          </Text>
          <Text style={[styles.body, { color: muted }]}>
            You can request account or data deletion by contacting the app owner. This placeholder should be replaced with a lawyer-reviewed policy before public launch.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Geist-Bold', fontSize: 20 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24, gap: 16 },
  updated: { fontFamily: 'Geist-Regular', fontSize: 13 },
  body: { fontFamily: 'Geist-Regular', fontSize: 16, lineHeight: 24 },
});
