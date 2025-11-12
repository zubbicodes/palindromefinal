import { useThemeContext } from '@/context/ThemeContext';
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
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { Switch } from 'react-native-switch';

const { width, height } = Dimensions.get('window');

export default function GameLayoutWeb() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useThemeContext();

  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorGradients = [
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
          <View key={col} style={[styles.cell, {backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#ffffffff', }]}>
            {isBulldog && (
              <Image
                source={require('../../assets/images/bulldog.png')}
                style={styles.bulldogImage}
                resizeMode="contain"
              />
            )}
            {letter && (
              <Text style={[styles.letterText, { color: colors.text }]}>
                {letter}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  ));

  const colorBlocks = colorGradients.map((gradient, i) => {
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
    <SafeAreaView style={{ flex: 1 }}>
      {/* ✅ REMOVED ScrollView - Using View instead for proper layout */}
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={theme === 'dark' ? ['#000017', '#000074'] : ['#FFFFFF', '#F5F5F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >

          

          <Text style={[styles.title, { color: colors.accent,}]}>PALINDROME</Text>

          <View
  style={{
    height: 1,
    width: '100%',
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
  }}
/>


          {/* ✅ Status Row */}
          <View style={styles.statusRow}>
            <View style={[styles.scoreBox, { backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#ffffffff',
            borderColor: colors.border }]}>
              <Text style={[styles.sideLabel, { color: colors.secondaryText }]}>Score</Text>
              <Text style={[styles.sideValue, { color: colors.accent }]}>{score}</Text>
            </View>

            <View style={styles.timerContainer}>
              <Svg height="60" width="300">
                <Defs>
                  <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#95DEFE" stopOpacity="1" />
                    <Stop offset="1" stopColor="#419EEF" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText fill="url(#grad)" fontSize="34" fontFamily="Geist-Regular" fontWeight="Bold" x="50%" y="60%" textAnchor="middle">
                  {time}
                </SvgText>
              </Svg>
            </View>

            <View style={[styles.scoreBox, { backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#ffffffff',
            borderColor: colors.border }]}>
              <Text style={[styles.sideLabel, { color: colors.secondaryText }]}>Hints</Text>
              <Text style={[styles.sideValue, { color: '#C35DD9' }]}>{hints}</Text>
            </View>
          </View>

          {/* ✅ Main Game Area */}
          <View style={styles.mainLayout}>
            <View style={styles.sideColumn}>
              <View style={[styles.colorBlockWrapper, { backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#f1f1f1ff',}]}>
                <View style={styles.colorBlockContainer}>{colorBlocks}</View>
              </View>
            </View>

            <View style={[styles.board, { backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#f1f1f1ff',}]}>{grid}</View>

            <View style={styles.sideColumn}>
              <View style={[styles.colorBlockWrapper, { backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#f1f1f1ff',}]}>
                <View style={styles.colorBlockContainer}>{colorBlocks}</View>
              </View>
            </View>
          </View>

          {/* ✅ Bottom Controls - Now always visible */}
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
              <BlurView intensity={20} 
              tint="default" 
              experimentalBlurMethod='dimezisBlurView' style={StyleSheet.absoluteFill}>
                <View style={styles.settingsOverlay}>
                  <LinearGradient
                    colors={theme === 'dark' ? ['#000017', '#000074'] : ['#FFFFFF', '#F5F5F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.settingsCard}
                  >

                    <View style={styles.headerRow}>
                      <View style={styles.headerSpacer} /> 
                      <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings</Text>
                      <Pressable onPress={() => setSettingsVisible(false)} style={styles.closeButton}>
                        <Text style={[styles.closeIcon, { color: colors.accent }]}>×</Text>
                      </Pressable>
                    </View>

                    {/* ✅ Profile */}
                    <View style={styles.profileSection}>
                      <Image
                        source={require('../../assets/images/profile.jpg')}
                        style={styles.profileImage}
                      />
                      <View style={styles.profileTextContainer}>
                        <Text style={[styles.profileName, { color: colors.text }]}>Lorem Ipsum</Text>
                        <Pressable onPress={() => router.push('/profile')}>
                          <Text style={[styles.profileLink, { color: colors.accent }]}>Edit Profile</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* ✅ Options */}
                    <View style={styles.optionRow}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>Sound</Text>
                      <Switch value={soundEnabled} onValueChange={setSoundEnabled} circleSize={18} barHeight={22} backgroundActive={colors.accent} backgroundInactive="#ccc" circleActiveColor="#fff" circleInActiveColor="#fff" switchWidthMultiplier={2.5} 
                      renderActiveText={false} renderInActiveText={false} />
                    </View>

                    <View style={styles.optionRow}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>Vibration</Text>
                      <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} circleSize={18} barHeight={22} backgroundActive={colors.accent} backgroundInactive="#ccc" circleActiveColor="#fff" circleInActiveColor="#fff" switchWidthMultiplier={2.5}
                      renderActiveText={false} renderInActiveText={false} />
                    </View>

                    <View style={styles.optionRow}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>Dark Mode</Text>
                      <Switch value={theme === 'dark'} onValueChange={toggleTheme} circleSize={18} barHeight={22} backgroundActive={colors.accent} backgroundInactive="#E5E5E5" circleActiveColor="#fff" circleInActiveColor="#fff" switchWidthMultiplier={2.5}
                      renderActiveText={false} renderInActiveText={false} />
                    </View>

                    {/* ✅ Links */}
                    <Pressable style={styles.linkRow}>
                      <Text style={[styles.linkText, { color: colors.text }]}>Privacy Policy</Text>
                      <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
                    </Pressable>
                    <Pressable style={styles.linkRow}>
                      <Text style={[styles.linkText, { color: colors.text }]}>Terms & Conditions</Text>
                      <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </BlurView>
            </View>
          )}

          {/* Pause Overlay */}
          {pause && (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={20} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill}/>
              <View style={styles.pauseOverlay}>
                <View style={[styles.pauseCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.pauseTitle, { color: colors.text }]}>Game Paused</Text>
                  <Pressable onPress={() => setPause(false)} style={styles.resumeButton}>
                    <Text style={styles.resumeButtonText}>Resume</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            
          )}
        
        </LinearGradient>
      </View>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: -1,
    
    justifyContent: 'space-between',
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    marginBottom: 10, // ⬅ Added little more space below title
    textAlign: 'center',
    marginTop: 15,
  },
  timerContainer: { 
  },
 statusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  gap: 220, // ⬅ gap matches the mainLayout side columns distance
  marginBottom: 40,
  marginTop: 40
},

  scoreBox: { 
    flexDirection: 'row', 
    borderWidth: 1, 
    borderRadius: 16, 
    width: 120, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 3,
  },
  sideLabel: { fontSize: 16 },
  sideValue: { marginLeft: 16, fontSize: 28, fontWeight: '600' },
  
  mainLayout: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 70, // ⬅ Increased gap between left, board, right
    flex: 1,
    marginVertical: 10,
  },
  
  sideColumn: { 
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBlockWrapper: { 
    borderRadius: 14, 
    paddingVertical: 12, // ⬅ Added equal top & bottom padding for vertical spacing
    paddingHorizontal: 16, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    width: 130, 
    height: 'auto', 
  },
  colorBlockContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 16, // ⬅ Added gap between color blocks vertically
    height: 580,
  },
  colorBlock: { 
    width: 100, 
    height: 98, 
    borderRadius: 32, 
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
  blockText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  
  board: { 
    width: width > 900 ? 400 : Math.min(width * 0.6, 400),
    aspectRatio: 1, 
    borderRadius: 16, 
    padding: 6, 
    justifyContent: 'center', 
    alignItems: 'center',
    minWidth: 600,
    maxWidth: 600,
  },
  row: { flexDirection: 'row' },
  cell: { 
    width: 46, 
    height: 46, 
    borderWidth: 1, 
    borderColor: '#CCDAE466', 
    borderRadius: 6, 
    margin: 3,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  letterText: { fontWeight: '700', fontSize: 16 },
  bulldogImage: { width: 32, height: 32 },
  
  controlsRow: { 
    position: 'relative', // ⬅ fix position
    bottom: -10,           // ⬅ distance from bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 20,
    
  },


  controlBtn: { 
    width: 35, 
    height: 35, 
    borderRadius: 22.5, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  settingsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  settingsCard: { width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, height: '45%' },
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerSpacer: { flex: 1 },
  closeButton: { flex: 1, alignItems: 'flex-end' },
  settingsTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'Geist-Regular', marginTop: -10 },
  closeIcon: { fontSize: 28, fontWeight: '700', fontFamily: 'Geist-Regular' },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 60, height: 60, borderRadius: 25, marginRight: 15 },
  profileTextContainer: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileLink: { fontSize: 14, textDecorationLine: 'underline', marginTop: 10 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  optionLabel: { fontSize: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginVertical: 6 },
  linkText: { fontSize: 16 },
  arrow: { fontSize: 22, fontWeight: '600' },
  pauseOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pauseCard: { padding: 60, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  pauseTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  resumeButton: { backgroundColor: '#0060FF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  resumeButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
