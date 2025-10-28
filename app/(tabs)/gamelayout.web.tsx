import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { Switch } from 'react-native-switch';
const { width } = Dimensions.get('window');


export default function GameLayoutWeb() {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [pause, setPause] = useState(false);

  const gridSize = 11;
  const center = Math.floor(gridSize / 2);
  const word = 'PALINDROME';
  const halfWord = Math.floor(word.length / 2);

  const spawnBulldogs = () => {
    const totalBulldogs = 5;

    const blockedPositions = new Set<string>();
    for (let i = 0; i < word.length; i++) {
      blockedPositions.add(`${center},${center - halfWord + i}`);
    }
    for (let i = 0; i < word.length; i++) {
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

  useEffect(() => {
    spawnBulldogs();
  }, []);

  const colors = [
    ['#C40111', '#F01D2E'],
    ['#757F35', '#99984D'],
    ['#1177FE', '#48B7FF'],
    ['#111111', '#3C3C3C'],
    ['#E7CC01', '#E7E437'],
  ] as const;

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
          <View key={col} style={styles.cell}>
            {isBulldog && (
              <Image
                source={require('../../assets/images/bulldog.png')}
                style={styles.bulldogImage}
                resizeMode="contain"
              />
            )}
            {letter && <Text style={styles.letterText}>{letter}</Text>}
          </View>
        );
      })}
    </View>
  ));

  const colorBlocks = colors.map((gradient, i) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      })
    ).current;

    return (
      <Animated.View
        key={i}
        style={[styles.colorBlock, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBlock}
        >
          <Text style={styles.blockText}>16</Text>
        </LinearGradient>
      </Animated.View>
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PALINDROME</Text>

      <View style={styles.statusRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.sideLabel}>Score</Text>
          <Text style={styles.sideValue}>{score}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Svg height="40" width="300">
            <Defs>
              <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#95DEFE" stopOpacity="1" />
                <Stop offset="1" stopColor="#419EEF" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <SvgText fill="url(#grad)" fontSize="24" fontFamily="Geist-Regular" fontWeight="Bold" x="50%" y="60%" textAnchor="middle">
              {time}
            </SvgText>
          </Svg>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.sideLabel}>Hints</Text>
          <Text style={[styles.sideValue, { color: '#C35DD9' }]}>{hints}</Text>
        </View>
      </View>

      <View style={styles.mainLayout}>
        <View style={styles.sideColumn}>
          <View style={styles.colorBlockWrapper}>
            <View style={styles.colorBlockContainer}>{colorBlocks}</View>
          </View>
        </View>

        <View style={styles.board}>{grid}</View>

        <View style={styles.sideColumn}>
          <View style={styles.colorBlockWrapper}>
            <View style={styles.colorBlockContainer}>{colorBlocks}</View>
          </View>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.controlBtn}>
            <Ionicons name="play" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => setPause(true)}>
          <LinearGradient colors={['#ffee60', '#ffa40b']} style={styles.controlBtn}>
            <Ionicons name="pause" size={20} color="#de5f07" />
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.push('/profile')}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.controlBtn}>
            <Ionicons name="list" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => setSettingsVisible(true)}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.controlBtn}>
            <Ionicons name="settings" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* ✅ Settings Modal Overlay */}
      {settingsVisible && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={20} tint="default" experimentalBlurMethod='dimezisBlurView' style={StyleSheet.absoluteFill}>
            <View style={styles.settingsOverlay}>
              <View style={styles.settingsCard}>
                <View style={styles.headerRow}>
                    <View style={styles.headerSpacer} /> 
                        <Text style={styles.settingsTitle}>Settings</Text>
                        <Pressable onPress={() => setSettingsVisible(false)} style={styles.closeButton}>
                        <Text style={styles.closeIcon}>×</Text>
                          </Pressable>
                      </View>

                <View style={styles.profileSection}>
                                  <Image
                                    source={require('../../assets/images/profile.jpg')}
                                    style={styles.profileImage}
                                  />
                
                                <View style={styles.profileTextContainer}>
                                  <Text style={styles.profileName}>Lorem Ipsum</Text>
                                  <Pressable onPress={() => router.push('/profile')}>
                                    <Text style={styles.profileLink}>Edit Profile</Text>
                                  </Pressable>
                                </View>
                              </View>
                <View style={styles.optionRow}>
  <Text style={styles.optionLabel}>Sound</Text>
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
  <Text style={styles.optionLabel}>Vibration</Text>
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
  <Text style={styles.optionLabel}>Dark Mode</Text>
  <Switch
    value={darkModeEnabled}
    onValueChange={setDarkModeEnabled}
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


                <Pressable style={styles.linkRow}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
                <Pressable style={styles.linkRow}>
                  <Text style={styles.linkText}>Terms & Conditions</Text>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      )}
      {/* Pause Overlay */}
              {pause && (
        <View style={StyleSheet.absoluteFill}>
          {/* Background Blur */}
          <BlurView
            intensity={20}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
      
          {/* Centered Card */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#0060FF', marginBottom: 10, textAlign: 'center' },
  timerContainer: { marginBottom: 12 },
  mainLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch', 
    flexWrap: 'nowrap',
    gap: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%',
    marginBottom: 12,
  },
  sideColumn: {
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 40,
  },
  colorBlockWrapper: {
    backgroundColor: '#F7F9FB',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: 90,
    height: '100%', // ✅ ensures vertical alignment with the board
    justifyContent: 'space-between', // distribute evenly
  },
  scoreBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#E1E6EB',
    borderWidth: 1,
    borderRadius: 12,
    width: 90,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sideLabel: { fontSize: 10, color: '#4C575F' },
  sideValue: { marginLeft: 8, fontSize: 20, color: '#0060FF', fontWeight: '600' },
  board: {
    width: width > 900 ? 440 : width * 0.6,
    aspectRatio: 1,
    backgroundColor: '#E4EBF0',
    borderRadius: 16,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CCDAE466',
    borderRadius: 6,
    margin: 3.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: { fontWeight: '700', color: '#000' },
  bulldogImage: { width: 20, height: 20 },
  colorBlockContainer: { alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  colorBlock: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  gradientBlock: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 16 },
  controlBtn: {
    width: 35,
    height: 35,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
settingsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  settingsCard: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, height: '65%' },
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerSpacer: {
  flex: 1,
},

closeButton: {
  flex: 1,
  alignItems: 'flex-end',
},

  settingsTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'Geist-Regular', color: '#000', marginTop: -10 },
  closeIcon: { fontSize: 26, color: '#007AFF', marginTop: -10 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  profileImage: { width: 70, height: 70, borderRadius: 35, marginBottom: 10, marginRight: 12 },
  profileName: { fontWeight: '500', fontSize: 18, color: '#000', fontFamily: 'Geist-Bold', marginBottom: 4 },
  profileLink: { color: '#007AFF', fontSize: 14, fontWeight: '400' },
  profileTextContainer: { flexDirection: 'column', justifyContent: 'center'},
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  optionLabel: { fontSize: 16, color: '#000', fontWeight: '500' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  linkText: { color: '#000', fontSize: 16, fontWeight: '500' },
  arrow: {
    color: '#0060FF',
    fontSize: 32,
  },
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
