import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

const webFontCss = `
@font-face {
  font-family: 'Geist-Regular';
  src: url('/Geist-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Geist-Bold';
  src: url('/Geist-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`;

const SplashScreen = Platform.select({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  web: require('../screens/loadscreen.web').default,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require('../screens/loadscreen.native').default,
});

// Separate component to apply gradient background globally
function AppContent() {
  const { theme } = useThemeContext();

  // Figma dark gradient colors
  const darkGradient = ['#0F172A', '#1E1B4B', '#312E81'] as const;
const lightGradient = ['#FFFFFF', '#E2E8F0'] as const;


  return (
    <LinearGradient
      colors={theme === 'dark' ? darkGradient : lightGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </LinearGradient>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = Font.useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          'Geist-Regular': require('../assets/fonts/Geist-Regular.ttf'),
          'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
        }
  );

  useEffect(() => {
    if (authLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const routeName = segments[1] ?? 'index';
    const isPublicRoute = (inTabsGroup && (routeName === 'index' || routeName === 'signup')) || segments[0] === 'auth';

    if (!user && !isPublicRoute) {
      // Redirect to the sign-in page.
      router.replace('/');
    } else if (user && segments[0] !== '(tabs)') {
      // Redirect to the home page.
      router.replace('/(tabs)/gamelayout');
    }
  }, [user, segments, authLoading]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, authLoading]);

  // const shouldShowSplash = !fontsLoaded || authLoading || showSplash;

  // if (shouldShowSplash) {
  //   return (
  //     <Animated.View exiting={FadeOut.duration(600)} style={{ flex: 1 }}>
  //       {Platform.OS === 'web'
  //         ? React.createElement('style', { dangerouslySetInnerHTML: { __html: webFontCss } })
  //         : null}
  //       <SplashScreen onReady={() => {}} />
  //     </Animated.View>
  //   );
  // }

  // ✅ Wrap your entire app in ThemeProvider
  return (
    <ThemeProvider>
      {Platform.OS === 'web'
        ? React.createElement('style', { dangerouslySetInnerHTML: { __html: webFontCss } })
        : null}
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
