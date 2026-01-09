import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { Switch } from 'react-native-switch';
import GameLayoutWeb from './gamelayout.web';

// ✅ Import theme context
import { useThemeContext } from '@/context/ThemeContext';

export default function GameLayout() {
  if (Platform.OS === 'web') {
    return <GameLayoutWeb />;
  }

  // ✅ Get theme and toggle function from context
  const { theme, toggleTheme } = useThemeContext();

  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [remainingBlocks, setRemainingBlocks] = useState(5);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [pause, setPause] = useState(false);

  // ✅ Local state sync with context
  const [darkModeEnabled, setDarkModeEnabled] = useState(theme === 'dark');

  const handlePlay = () => setScore(prev => prev + 1);

  const spawnBulldogs = () => {
    const totalBulldogs = 5;
    const gridSize = 11;
    const center = Math.floor(gridSize / 2);
    const word = 'PALINDROME';
    const halfWord = Math.floor(word.length / 2);
    const blockedPositions = new Set<string>();

    for (let i = 0; i < word.length; i++) {
      blockedPositions.add(`${center},${center - halfWord + i}`);
      blockedPositions.add(`${center - halfWord + i},${center}`);
    }

    const newPositions: { row: number; col: number }[] = [];
    while (newPositions.length < totalBulldogs) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      const key = `${row},${col}`;
      if (!blockedPositions.has(key) && !newPositions.some(p => p.row === row && p.col === col)) {
        newPositions.push({ row, col });
      }
    }
    setBulldogPositions(newPositions);
  };

  useEffect(() => spawnBulldogs(), []);

  const gridSize = 11;
  const center = Math.floor(gridSize / 2);
  const word = 'PALINDROME';
  const halfWord = Math.floor(word.length / 2);

  const grid = Array.from({ length: gridSize }, (_, row) => (
    <View key={row} style={styles.row}>
      {Array.from({ length: gridSize }, (_, col) => {
        const isBulldog = bulldogPositions.some(pos => pos.row === row && pos.col === col);
        let letter: string | null = null;
        if (row === center && col >= center - halfWord && col < center - halfWord + word.length) {
          letter = word[col - (center - halfWord)];
        }
        if (col === center && row >= center - halfWord && row < center - halfWord + word.length) {
          letter = word[row - (center - halfWord)];
        }

        return (
          <Pressable
            key={col}
            style={[
              styles.cell,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(25,25,91,0.7)' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#CCDAE466',
              },
            ]}
            onPress={() => {
              if (isBulldog) {
                setScore(prev => prev + 5);
                spawnBulldogs();
              } else handlePlay();
            }}
          >
            {isBulldog && (
              <Image
                source={require('../../assets/images/bulldog.png')}
                style={styles.bulldogImage}
                resizeMode="contain"
              />
            )}
            {letter && (
              <Text
                style={[
                  styles.letterText,
                  { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                ]}
              >
                {letter}
              </Text>
            )}
            <View style={styles.innerShadow} />
          </Pressable>
        );
      })}
    </View>
  ));

  const colors = [
    ['#C40111', '#F01D2E'],
    ['#757F35', '#99984D'],
    ['#1177FE', '#48B7FF'],
    ['#111111', '#3C3C3C'],
    ['#E7CC01', '#E7E437'],
  ] as const;

  const blocks = colors.map((gradient, index) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          setRemainingBlocks(prev => Math.max(prev - 1, 0));
        },
      })
    ).current;

    return (
      <Animated.View
        key={index}
        style={[styles.colorBlock, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientColorBlock}
        >
          <Text style={styles.blockText}>16</Text>
        </LinearGradient>
      </Animated.View>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={
          theme === 'dark'
            ? ['rgba(0, 0, 23, 1)', 'rgba(0, 0, 116, 1)'] // dark mode colors
            : ['#FFFFFF', '#FFFFFF'] // light mode colors
        }
        style={styles.background}
      />
      <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#0060FF' }]}>
        PALINDROME
      </Text>

      <View
        style={[
          styles.rectangleLeft,
          {
            backgroundColor:
              theme === 'dark' ? 'rgba(25,25,91,0.7)' : 'rgba(229,236,241,0.5)',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#C7D5DF',
          },
        ]}
      >
        <Text style={[styles.rectangleLabel, { color: theme === 'dark' ? '#FFFFFF' : '#4C575F' }]}>
          Score
        </Text>
        <Text
          style={[
            styles.rectangleValue,
            { color: theme === 'dark' ? '#FFFFFF' : '#0060FF' },
          ]}
        >
          {score}
        </Text>
      </View>

      <View
        style={[
          styles.rectangleRight,
          {
            backgroundColor:
              theme === 'dark' ? 'rgba(25,25,91,0.7)' : 'rgba(229,236,241,0.5)',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#C7D5DF',
          },
        ]}
      >
        <Text style={[styles.rectangleLabel, { color: theme === 'dark' ? '#FFFFFF' : '#4C575F' }]}>
          Hints
        </Text>
        <Text
          style={[
            styles.rectangleValue,
            { color: '#C35DD9' },
          ]}
        >
          {hints}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Svg height="40" width="300">
          <Defs>
            <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#95DEFE" stopOpacity="1" />
              <Stop offset="1" stopColor="#419EEF" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#grad)"
            fontSize="24"
            fontWeight="bold"
            x="50%"
            y="60%"
            textAnchor="middle"
          >
            {time}
          </SvgText>
        </Svg>
      </View>

      <View
        style={[
          styles.board,
          { backgroundColor: theme === 'dark' ? 'rgba(25,25,91,0.7)' : '#E4EBF0' },
        ]}
      >
        {grid}
      </View>

      <View
        style={[
          styles.colorBlocksContainer,
          { backgroundColor: theme === 'dark' ? 'rgba(25,25,91,0.7)' : '#E4EBF0' },
        ]}
      >
        <View style={styles.colorBlocksRow}>{blocks}</View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable onPress={() => console.log('Play')}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="play" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => setPause(true)}>
          <LinearGradient colors={['#ffee60', '#ffa40b']} style={styles.gradientButton}>
            <Ionicons name="pause" size={20} color="#de5f07" />
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.push('/profile')}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="list" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => setSettingsVisible(true)}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="settings" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* ⚙️ Settings Modal */}
      {settingsVisible && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={20}
            tint={theme === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.settingsOverlay}>
              <LinearGradient
                colors={
                  theme === 'dark'
                    ? ['rgba(0, 0, 23, 1)', 'rgba(0, 0, 116, 1)'] // Dark gradient
                    : ['#FFFFFF', '#FFFFFF'] // Light theme pure white
                }
                style={[styles.settingsCard, { padding: 20, borderRadius: 20 }]}
              >
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.headerSpacer} />
                  <Text
                    style={[
                      styles.settingsTitle,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Settings
                  </Text>
                  <Pressable onPress={() => setSettingsVisible(false)} style={styles.closeButton}>
                    <Text style={[styles.closeIcon, { color: '#007AFF' }]}>×</Text>
                  </Pressable>
                </View>

                {/* Profile */}
                <View style={styles.profileSection}>
                  <Image
                    source={require('../../assets/images/profile.jpg')}
                    style={styles.profileImage}
                  />
                  <View style={styles.profileTextContainer}>
                    <Text
                      style={[
                        styles.profileName,
                        { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      Lorem Ipsum
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSettingsVisible(false);
                        setTimeout(() => router.push('/profile'), 50);
                      }}
                    >
                      <Text style={styles.profileLink}>Edit Profile</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Toggles */}
                <View style={styles.optionRow}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Sound
                  </Text>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    disabled={false}
                    activeText=""
                    inActiveText=""
                    circleSize={18}
                    barHeight={22}
                    circleBorderWidth={0}
                    backgroundActive="#0060FF"
                    backgroundInactive="#ccc"
                    circleActiveColor="#FFFFFF"
                    circleInActiveColor="#FFFFFF"
                    changeValueImmediately={true}
                    switchWidthMultiplier={2.5}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Vibration
                  </Text>
                  <Switch
                    value={vibrationEnabled}
                    onValueChange={setVibrationEnabled}
                    disabled={false}
                    activeText=""
                    inActiveText=""
                    circleSize={18}
                    barHeight={22}
                    circleBorderWidth={0}
                    backgroundActive="#0060FF"
                    backgroundInactive="#ccc"
                    circleActiveColor="#FFFFFF"
                    circleInActiveColor="#FFFFFF"
                    changeValueImmediately={true}
                    switchWidthMultiplier={2.5}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Dark Mode
                  </Text>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={() => {
                      toggleTheme(); // ✅ Toggle context theme
                      setDarkModeEnabled(prev => !prev); // Sync switch state
                    }}
                    disabled={false}
                    activeText=""
                    inActiveText=""
                    circleSize={18}
                    barHeight={22}
                    circleBorderWidth={0}
                    backgroundActive="#0060FF"
                    backgroundInactive="#E5E5E5"
                    circleActiveColor="#FFFFFF"
                    circleInActiveColor="#FFFFFF"
                    changeValueImmediately={true}
                    switchWidthMultiplier={2.5}
                  />
                </View>

                {/* Links */}
                <Pressable style={styles.linkRow}>
                  <Text
                    style={[
                      styles.linkText,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Privacy Policy
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#0060FF" />
                </Pressable>

                <Pressable style={[styles.linkRow, { borderBottomWidth: 0 }]}>
                  <Text
                    style={[
                      styles.linkText,
                      { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    Terms & Conditions
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#0060FF" />
                </Pressable>
              </LinearGradient>
            </View>

          </BlurView>
        </View>
      )}

      {/* Pause Overlay */}
      {pause && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={20}
            tint={theme === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseCard}>
              <Text style={styles.pauseTitle}>Game Paused</Text>
              <Pressable onPress={() => setPause(false)} style={styles.resumeButton}>
                <Text style={styles.resumeButtonText}>Resume</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: { position: 'absolute', top: 70, fontFamily: 'Geist-Bold', fontSize: 26, color: '#0060FF' },
  rectangleLeft: { position: 'absolute', top: 140, left: '55%', marginLeft: -134 / 2 - 124.5, width: 104, height: 64, backgroundColor: 'rgba(229,236,241,0.5)', borderWidth: 1, borderColor: '#C7D5DF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rectangleRight: { position: 'absolute', top: 140, left: '45%', marginLeft: 137.5 - 104 / 2, width: 104, height: 64, backgroundColor: 'rgba(229,236,241,0.5)', borderWidth: 1, borderColor: '#C7D5DF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rectangleLabel: { fontSize: 14, color: '#4C575F' },
  rectangleValue: { fontSize: 24, fontWeight: '900', color: '#0060FF' },
  timerContainer: { position: 'absolute', top: 160, alignSelf: 'center' },
  board: { position: 'relative', top: 200, width: 350, height: 376, backgroundColor: '#E4EBF0', borderRadius: 16, padding: 6, alignItems: 'center' },
  row: { flexDirection: 'row' },
  cell: { width: 27, height: 30, borderWidth: 1, borderColor: '#CCDAE466', backgroundColor: '#FFFFFF', margin: 1.5, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  letterText: { fontFamily: 'Geist-Bold', color: '#000', fontSize: 14 },
  innerShadow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 6 },
  bulldogImage: { width: 20, height: 20, position: 'absolute', top: 4, left: 4 },
  colorBlocksContainer: { position: 'absolute', top: 630, width: 320, height: 70, backgroundColor: '#E4EBF0', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  colorBlocksRow: { flexDirection: 'row', justifyContent: 'space-between', width: 300 },
  colorBlock: { width: 50, height: 50, borderRadius: 8, marginHorizontal: 4 },
  gradientColorBlock: { flex: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  blockText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  controlsRow: { position: 'absolute', top: 720, width: 240, flexDirection: 'row', justifyContent: 'space-around' },
  gradientButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  // ⚙️ Settings Styles
  settingsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  settingsCard: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, height: '53.65%' },
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerSpacer: {
    flex: 1,
  },

  closeButton: {
    flex: 1,
    alignItems: 'flex-end',
  },

  settingsTitle: { fontSize: 24, fontWeight: '900', fontFamily: 'Geist-Regular', color: '#000', marginTop: -10 },
  closeIcon: { fontSize: 32, color: '#007AFF', marginTop: -10 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  profileImage: { width: 70, height: 70, borderRadius: 35, marginBottom: 10, marginRight: 12 },
  profileName: { fontWeight: '500', fontSize: 18, color: '#000', fontFamily: 'Geist-Bold', marginBottom: 4 },
  profileLink: { color: '#007AFF', fontSize: 14, fontWeight: '400' },
  profileTextContainer: { flexDirection: 'column', justifyContent: 'center' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  optionLabel: { fontSize: 16, color: '#000', fontWeight: '500' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  linkText: { color: '#000', fontSize: 16, fontWeight: '500' },
  pauseOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pauseCard: {
    width: '70%',                // reduce length
    maxWidth: 320,               // optional, for desktop/web scaling
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,                // Android shadow
  },

  pauseTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#000000ff',
    fontFamily: 'Geist-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  resumeButton: {
    backgroundColor: '#0060FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Geist-Regular',
  },

});