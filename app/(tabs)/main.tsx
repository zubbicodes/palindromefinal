import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

function SpotlightMask(props: { rect: MeasuredRect }) {
  const { width, height } = useWindowDimensions();

  if (!props.rect) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />;
  }

  // Add padding around the target
  const padding = 8;
  const safeX = Math.max(0, props.rect.x - padding);
  const safeY = Math.max(0, props.rect.y - padding);
  const safeW = Math.min(width - safeX, props.rect.width + padding * 2);
  const safeH = Math.min(height - safeY, props.rect.height + padding * 2);

  const maskColor = 'rgba(0,0,0,0.75)'; // Slightly darker for better contrast

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: width, height: safeY, backgroundColor: maskColor }} />
      {/* Bottom */}
      <View style={{ position: 'absolute', top: safeY + safeH, left: 0, width: width, height: height - (safeY + safeH), backgroundColor: maskColor }} />
      {/* Left */}
      <View style={{ position: 'absolute', top: safeY, left: 0, width: safeX, height: safeH, backgroundColor: maskColor }} />
      {/* Right */}
      <View style={{ position: 'absolute', top: safeY, left: safeX + safeW, right: 0, height: safeH, backgroundColor: maskColor }} />
      
      {/* Optional: A subtle glow or border around the target to make it "pop" */}
      <View
        style={{
          position: 'absolute',
          top: safeY,
          left: safeX,
          width: safeW,
          height: safeH,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.3)',
          shadowColor: '#FFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        }}
      />
    </View>
  );
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
        <SpotlightMask rect={props.rect} />

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
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState<string>('Player');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columns = width >= 360 ? 2 : 1;
  const isCompact = width < 420;
  const float = useRef(new Animated.Value(0)).current;

  const backgroundColors = useMemo(() => {
    return isDark ? (['#000017', '#000074'] as const) : (['#FFFFFF', '#E9EFFF'] as const);
  }, [isDark]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [float]);

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

  const orbAOffset = float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const orbBOffset = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const orbCOffset = float.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  return (
    <LinearGradient colors={backgroundColors} style={{ flex: 1 }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orb, styles.orbA, { transform: [{ translateY: orbAOffset }] }]}>
          <LinearGradient colors={['rgba(142,217,252,0.55)', 'rgba(60,141,234,0.0)']} style={styles.orbFill} />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orbB, { transform: [{ translateY: orbBOffset }] }]}>
          <LinearGradient colors={['rgba(255,238,96,0.55)', 'rgba(255,164,11,0.0)']} style={styles.orbFill} />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orbC, { transform: [{ translateY: orbCOffset }] }]}>
          <LinearGradient colors={['rgba(195,93,217,0.42)', 'rgba(195,93,217,0.0)']} style={styles.orbFill} />
        </Animated.View>
      </View>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isCompact ? 14 : 16,
              paddingTop: insets.top + (isCompact ? 12 : 16),
              paddingBottom: 28,
            },
          ]}
        >
          <View style={[styles.topbarWrap, { borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}>
            <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.topbarRow}>
              <View style={styles.brandWrap}>
                <Text style={[styles.brand, { color: isDark ? '#FFFFFF' : '#0060FF' }]}>PALINDROME®</Text>
                <Text style={[styles.welcome, { color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.62)' }]}>
                  Welcome, {displayName}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={toggleTheme}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
                      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle theme"
                >
                  <Ionicons name={isDark ? 'sunny' : 'moon'} size={19} color={isDark ? '#FFFFFF' : '#0060FF'} />
                </Pressable>

                <Pressable
                  onPress={openTour}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
                      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Open UI tour"
                >
                  <Ionicons name="help-circle-outline" size={19} color={isDark ? '#FFFFFF' : '#0060FF'} />
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
                      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                >
                  <Ionicons name="log-out-outline" size={19} color={isDark ? '#FFFFFF' : '#111111'} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#0A0F2D' }]}>Choose Your Mode</Text>
            <Text
              style={[
                styles.heroSubtitle,
                { color: isDark ? 'rgba(255,255,255,0.74)' : 'rgba(17,17,17,0.62)' },
              ]}
            >
              Jump in fast. Multiplayer and Practice land soon.
            </Text>
          </View>

          <View style={styles.tileGrid}>
            <View ref={singleRef} style={[styles.tileWrap, { width: columns === 2 ? '50%' : '100%' }]}>
              <MenuTile
                title="Single Player"
                subtitle="Start a new game"
                badge="Play"
                icon="person"
                colors={['#8ed9fc', '#3c8dea']}
                onPress={handleSinglePlayer}
              />
            </View>

            <View ref={multiRef} style={[styles.tileWrap, { width: columns === 2 ? '50%' : '100%' }]}>
              <MenuTile
                title="Multiplayer"
                subtitle="Play with friends"
                badge="Soon"
                icon="people"
                colors={['#ffee60', '#ffa40b']}
                onPress={handleComingSoon}
              />
            </View>

            <View ref={practiceRef} style={[styles.tileWrap, { width: columns === 2 ? '50%' : '100%' }]}>
              <MenuTile
                title="Practice Mode"
                subtitle="Warm up and explore"
                badge="Soon"
                icon="school"
                colors={['#C40111', '#F01D2E']}
                onPress={handleComingSoon}
              />
            </View>

            <View ref={settingsRef} style={[styles.tileWrap, { width: columns === 2 ? '50%' : '100%' }]}>
              <MenuTile
                title="Settings"
                subtitle="Profile and preferences"
                badge="Open"
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

function MenuTile(props: {
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string];
  onPress: () => void;
}) {
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [sparkle]);

  const sparkleTranslate = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.tilePressable,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowOpacity: pressed ? 0.14 : 0.24,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.title}
    >
      <LinearGradient colors={props.colors} style={styles.tileGradient}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.spark,
            {
              transform: [{ translateY: sparkleTranslate }],
              opacity: 0.55,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']}
            style={styles.sparkFill}
          />
        </Animated.View>

        <View style={styles.tileInner}>
          <View style={styles.tileTopRow}>
            <View style={styles.tileIconWrap}>
              <Ionicons name={props.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{props.badge}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.tileTitle}>{props.title}</Text>
            <Text style={styles.tileSubtitle}>{props.subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbFill: {
    flex: 1,
    borderRadius: 999,
  },
  orbA: {
    width: 280,
    height: 280,
    left: -120,
    top: -130,
  },
  orbB: {
    width: 320,
    height: 320,
    right: -170,
    top: 40,
  },
  orbC: {
    width: 360,
    height: 360,
    right: -220,
    bottom: -260,
  },
  topbarWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  topbarRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandWrap: {
    flexShrink: 1,
  },
  brand: {
    fontFamily: 'Geist-Bold',
    fontSize: 18,
    letterSpacing: 0.6,
  },
  welcome: {
    fontFamily: 'Geist-Regular',
    fontSize: 12,
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroTitle: {
    fontFamily: 'Geist-Bold',
    fontSize: 24,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    marginHorizontal: -6,
  },
  tileWrap: {
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  tilePressable: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 6,
  },
  tileGradient: {
    borderRadius: 18,
    minHeight: 114,
  },
  tileInner: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
    minHeight: 114,
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    fontFamily: 'Geist-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
  },
  tileTitle: {
    fontFamily: 'Geist-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
  },
  tileSubtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.90)',
    marginTop: 6,
  },
  spark: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 46,
    height: 46,
    borderRadius: 999,
  },
  sparkFill: {
    flex: 1,
    borderRadius: 999,
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
