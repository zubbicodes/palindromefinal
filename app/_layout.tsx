import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

const SplashScreen = Platform.select({
  web: require('../screens/loadscreen.web').default,
  default: require('../screens/loadscreen.native').default,
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = Font.useFonts({
    'Geist-Regular': require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 5000); // show splash for 3s
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Wait for fonts to load before showing anything
  if (!fontsLoaded) {
    return null; // or return a simple loading view
  }

  // Show splash screen
  if (showSplash) {
    return (
      <Animated.View exiting={FadeOut.duration(600)} style={{ flex: 1 }}>
        <SplashScreen onReady={undefined} />
      </Animated.View>
    );
  }

  // Normal app navigation after splash
  return <Stack screenOptions={{ headerShown: false }} />;
}