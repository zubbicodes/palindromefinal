import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

type TourStep = {
  title: string;
  description: string;
  target: 'single' | 'multi' | 'practice' | 'settings' | null;
};

type MeasuredRect = { x: number; y: number; width: number; height: number } | null;

const TOUR_SEEN_KEY = 'palindrome_ui_tour_v1_seen';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function TourOverlayNative(props: {
  open: boolean;
  stepIndex: number;
  steps: TourStep[];
  rect: MeasuredRect;
  isDark: boolean;
  accentColor: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const step = props.steps[props.stepIndex];
  if (!props.open || !step) return null;

  const isLast = props.stepIndex === props.steps.length - 1;

  return (
    <Modal visible={props.open} transparent animationType="fade" onRequestClose={props.onSkip}>
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />

        {props.rect ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: props.rect.x - 10,
              top: props.rect.y - 10,
              width: props.rect.width + 20,
              height: props.rect.height + 20,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: props.accentColor,
              backgroundColor: 'rgba(255,255,255,0.02)',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 14 },
              elevation: 10,
            }}
          />
        ) : null}

        <TourTooltip
          step={step}
          stepIndex={props.stepIndex}
          stepsCount={props.steps.length}
          rect={props.rect}
          isDark={props.isDark}
          accentColor={props.accentColor}
          onBack={props.onBack}
          onNext={props.onNext}
          onSkip={props.onSkip}
          onDone={props.onDone}
          isLast={isLast}
        />
      </View>
    </Modal>
  );
}

function TourTooltip(props: {
  step: TourStep;
  stepIndex: number;
  stepsCount: number;
  rect: MeasuredRect;
  isDark: boolean;
  accentColor: string;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const { width: viewportW, height: viewportH } = useWindowDimensions();
  const tooltipW = Math.min(360, viewportW - 32);
  const tooltipH = 190;

  const baseLeft = props.rect ? props.rect.x + props.rect.width / 2 - tooltipW / 2 : viewportW / 2 - tooltipW / 2;
  const preferTop = props.rect ? props.rect.y > viewportH * 0.6 : false;
  const baseTop = props.rect
    ? preferTop
      ? props.rect.y - tooltipH - 18
      : props.rect.y + props.rect.height + 18
    : viewportH / 2 - tooltipH / 2;

  const left = clamp(baseLeft, 16, viewportW - tooltipW - 16);
  const top = clamp(baseTop, 16, viewportH - tooltipH - 16);

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: tooltipW,
        borderRadius: 18,
        padding: 16,
        backgroundColor: props.isDark ? 'rgba(10,10,28,0.96)' : 'rgba(255,255,255,0.97)',
        borderWidth: 1,
        borderColor: props.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 18 },
        elevation: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Text style={{ fontFamily: 'Geist-Bold', fontSize: 15, color: props.isDark ? '#FFFFFF' : '#111111' }}>
          {props.step.title}
        </Text>
        <Text style={{ fontFamily: 'Geist-Regular', fontSize: 12, color: props.isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,17,17,0.55)' }}>
          {props.stepIndex + 1}/{props.stepsCount}
        </Text>
      </View>

      <Text style={{ marginTop: 8, fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 18, color: props.isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.78)' }}>
        {props.step.description}
      </Text>

      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={props.onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip tour"
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: props.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.16)',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: props.isDark ? '#FFFFFF' : '#111111' }}>
            Skip
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={props.onBack}
            disabled={props.stepIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: props.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.16)',
              opacity: props.stepIndex === 0 ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: props.isDark ? '#FFFFFF' : '#111111' }}>
              Back
            </Text>
          </Pressable>

          <Pressable
            onPress={props.isLast ? props.onDone : props.onNext}
            accessibilityRole="button"
            accessibilityLabel={props.isLast ? 'Finish tour' : 'Next step'}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: props.accentColor,
              borderWidth: 1,
              borderColor: props.accentColor,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Geist-Bold', fontSize: 13, color: '#FFFFFF' }}>
              {props.isLast ? 'Got it' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MainScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useThemeContext();
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

  const steps: TourStep[] = useMemo(
    () => [
      {
        title: 'Quick Tour',
        description: 'Here’s a short walkthrough of the main options. You’ll only see this once.',
        target: null,
      },
      {
        title: 'Single Player',
        description: 'Start a new match and play at your own pace. This is the best place to begin.',
        target: 'single',
      },
      {
        title: 'Multiplayer',
        description: 'Play with friends when Multiplayer is available. For now, you’ll see “Coming Soon”.',
        target: 'multi',
      },
      {
        title: 'Practice Mode',
        description: 'A relaxed mode for learning patterns and warming up. This is also landing soon.',
        target: 'practice',
      },
      {
        title: 'Settings & Profile',
        description: 'Update your profile and preferences.',
        target: 'settings',
      },
    ],
    [],
  );

  const singleRef = useRef<View>(null);
  const multiRef = useRef<View>(null);
  const practiceRef = useRef<View>(null);
  const settingsRef = useRef<View>(null);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourRect, setTourRect] = useState<MeasuredRect>(null);

  useEffect(() => {
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(TOUR_SEEN_KEY);
        if (seen === '1') return;
        setTimeout(() => setTourOpen(true), 450);
      } catch {
        return;
      }
    })();
  }, []);

  const openTour = useCallback(() => {
    setTourRect(null);
    setTourStepIndex(0);
    setTourOpen(true);
  }, []);

  const finishTour = useCallback(() => {
    void AsyncStorage.setItem(TOUR_SEEN_KEY, '1');
    setTourOpen(false);
  }, []);

  const nextTour = useCallback(() => {
    setTourStepIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        finishTour();
        return i;
      }
      return next;
    });
  }, [finishTour, steps.length]);

  const backTour = useCallback(() => {
    setTourStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipTour = useCallback(() => {
    finishTour();
  }, [finishTour]);

  useEffect(() => {
    if (!tourOpen) return;
    const target = steps[tourStepIndex]?.target ?? null;
    if (!target) {
      setTourRect(null);
      return;
    }

    const ref =
      target === 'single'
        ? singleRef
        : target === 'multi'
          ? multiRef
          : target === 'practice'
            ? practiceRef
            : settingsRef;

    const measure = () => {
      ref.current?.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) setTourRect({ x, y, width: w, height: h });
        else setTourRect(null);
      });
    };

    const t1 = setTimeout(() => requestAnimationFrame(measure), 60);
    const t2 = setTimeout(measure, 240);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [steps, tourOpen, tourStepIndex]);

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
                onPress={openTour}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,96,255,0.10)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Open UI tour"
              >
                <Ionicons name="help-circle-outline" size={20} color={isDark ? '#FFFFFF' : '#0060FF'} />
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
            <View ref={singleRef} style={{ width: columns === 2 ? '50%' : '100%', paddingRight: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Single Player"
                subtitle="Start a new game"
                icon="person"
                colors={['#8ed9fc', '#3c8dea']}
                onPress={handleSinglePlayer}
              />
            </View>

            <View ref={multiRef} style={{ width: columns === 2 ? '50%' : '100%', paddingLeft: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Multiplayer"
                subtitle="Play with friends"
                icon="people"
                colors={['#ffee60', '#ffa40b']}
                onPress={handleComingSoon}
              />
            </View>

            <View ref={practiceRef} style={{ width: columns === 2 ? '50%' : '100%', paddingRight: columns === 2 ? 9 : 0 }}>
              <MenuCard
                title="Practice Mode"
                subtitle="Warm up and explore"
                icon="school"
                colors={['#C40111', '#F01D2E']}
                onPress={handleComingSoon}
              />
            </View>

            <View ref={settingsRef} style={{ width: columns === 2 ? '50%' : '100%', paddingLeft: columns === 2 ? 9 : 0 }}>
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

        <TourOverlayNative
          open={tourOpen}
          stepIndex={tourStepIndex}
          steps={steps}
          rect={tourRect}
          isDark={isDark}
          accentColor={colors.accent}
          onBack={backTour}
          onNext={nextTour}
          onSkip={skipTour}
          onDone={finishTour}
        />
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
