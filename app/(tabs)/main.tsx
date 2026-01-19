import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

export default function MainScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const [displayName, setDisplayName] = useState<string>('Player');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columns = width >= 900 ? 2 : 1;

  const backgroundColors = useMemo(() => {
    return isDark ? (['#000017', '#000074'] as const) : (['#FFFFFF', '#E9EFFF'] as const);
  }, [isDark]);

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

      toastOpacity.stopAnimation();
      toastOpacity.setValue(0);

      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      toastTimeoutRef.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setToastMessage(null));
      }, 1600);
    },
    [toastOpacity],
  );

  useEffect(() => {
    void (async () => {
      const user = await authService.getSessionUser();
      const name = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || 'Player';
      setDisplayName(name);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await authService.signOut();
    router.replace('/');
  }, [router]);

  const handleSinglePlayer = useCallback(() => {
    router.push('/gamelayout');
  }, [router]);

  const handleComingSoon = useCallback(() => {
    showToast('Coming Soon');
  }, [showToast]);

  const handleSettings = useCallback(() => {
    router.push('/profile');
  }, [router]);

  return (
    <LinearGradient colors={backgroundColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: width >= 900 ? 40 : 20, paddingTop: 24, paddingBottom: 40 },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.brand, { color: isDark ? '#FFFFFF' : '#0060FF' }]}>PALINDROME®</Text>
              <Text style={[styles.welcome, { color: isDark ? '#DADADA' : '#49463F' }]}>
                Welcome, {displayName}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={toggleTheme}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,96,255,0.10)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Toggle theme"
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FFFFFF' : '#0060FF'} />
              </Pressable>

              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={20} color={isDark ? '#FFFFFF' : '#111111'} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.cardGrid, { gap: width >= 900 ? 18 : 14 }]}>
            <View style={{ width: columns === 2 ? '50%' : '100%', paddingRight: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Single Player"
                subtitle="Start a new game"
                icon="person"
                colors={['#8ed9fc', '#3c8dea']}
                onPress={handleSinglePlayer}
              />
            </View>

            <View style={{ width: columns === 2 ? '50%' : '100%', paddingLeft: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Multiplayer"
                subtitle="Play with friends"
                icon="people"
                colors={['#ffee60', '#ffa40b']}
                onPress={handleComingSoon}
              />
            </View>

            <View style={{ width: columns === 2 ? '50%' : '100%', paddingRight: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Practice Mode"
                subtitle="Warm up and explore"
                icon="school"
                colors={['#C40111', '#F01D2E']}
                onPress={handleComingSoon}
              />
            </View>

            <View style={{ width: columns === 2 ? '50%' : '100%', paddingLeft: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Settings"
                subtitle="Profile and preferences"
                icon="settings"
                colors={['#111111', '#3C3C3C']}
                onPress={handleSettings}
              />
            </View>
          </View>
        </ScrollView>

        {toastMessage ? (
          <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function MenuCard(props: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string];
  onPress: () => void;
}) {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.cardPressable,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowOpacity: pressed ? 0.12 : 0.2,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.title}
    >
      <LinearGradient colors={props.colors} style={styles.cardGradient}>
        <View style={styles.cardInner}>
          <View style={styles.cardIconRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <Ionicons name={props.icon} size={22} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.cardTitle}>{props.title}</Text>
          <Text style={[styles.cardSubtitle, { opacity: isDark ? 0.92 : 0.88 }]}>{props.subtitle}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerLeft: {
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontFamily: 'Geist-Bold',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  welcome: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  cardPressable: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 18,
  },
  cardGradient: {
    borderRadius: 22,
    minHeight: 140,
  },
  cardInner: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Geist-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 10,
  },
  cardSubtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 6,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'web' ? 22 : 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(17,17,17,0.92)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    maxWidth: 520,
  },
  toastText: {
    fontFamily: 'Geist-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
});

