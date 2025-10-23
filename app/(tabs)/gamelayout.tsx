import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';

export default function GameLayout() {
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');

  const handlePlay = () => {
    setScore(prev => prev + 1);
  };

  // Generate 11x11 grid
  const grid = Array.from({ length: 11 }, (_, row) => (
    <View key={row} style={styles.row}>
      {Array.from({ length: 11 }, (_, col) => (
        <Pressable key={col} style={styles.cell} onPress={handlePlay} />
      ))}
    </View>
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>PALINDROME</Text>

      {/* Left Rectangle (Score) */}
      <View style={styles.rectangleLeft}>
        <Text style={styles.rectangleLabel}>Score</Text>
        <Text style={styles.rectangleValue}>{score}</Text>
      </View>

      {/* Right Rectangle (Hints) */}
      <View style={styles.rectangleRight}>
        <Text style={styles.rectangleLabel}>Hints</Text>
        <Text style={[styles.rectangleValue, { color: '#C35DD9' }]}>{hints}</Text>
      </View>

      {/* Center Timer (Gradient Text using SVG) */}
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

      {/* Board Grid */}
      <View style={styles.board}>{grid}</View>

      {/* Controls */}
      <View style={styles.controlsRow}>
  <Pressable onPress={() => console.log('Play')}>
    <LinearGradient
      colors={['#8ed9fc', '#3c8dea']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientButton}
    >
      <Ionicons name="play" size={20} color="#1a63cc" />
    </LinearGradient>
  </Pressable>

  <Pressable onPress={() => console.log('Pause')}>
    <LinearGradient
      colors={['#ffee60', '#ffa40b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientButton}
    >
      <Ionicons name="pause" size={20} color="#de5f07" />
    </LinearGradient>
  </Pressable>

  <Pressable onPress={() => console.log('List')}>
    <LinearGradient
      colors={['#8ed9fc', '#3c8dea']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientButton}
    >
      <Ionicons name="list" size={20} color="#1a63cc" />
    </LinearGradient>
  </Pressable>

  <Pressable onPress={() => console.log('Settings')}>
    <LinearGradient
      colors={['#8ed9fc', '#3c8dea']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientButton}
    >
      <Ionicons name="settings" size={20} color="#1a63cc" />
    </LinearGradient>
  </Pressable>
</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  title: {
    position: 'absolute',
    top: 70,
    fontFamily: 'Geist-Bold',
    fontWeight: '400',
    fontSize: 26,
    lineHeight: 28,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#0060FF',
  },

  rectangleLeft: {
    position: 'absolute',
    top: 128,
    left: '50%',
    marginLeft: -104 / 2 - 124.5,
    width: 104,
    height: 64,
    backgroundColor: 'rgba(229,236,241,0.5)',
    borderWidth: 1,
    borderColor: '#C7D5DF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rectangleRight: {
    position: 'absolute',
    top: 128,
    left: '50%',
    marginLeft: 125.5 - 104 / 2,
    width: 104,
    height: 64,
    backgroundColor: 'rgba(229,236,241,0.5)',
    borderWidth: 1,
    borderColor: '#C7D5DF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rectangleLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4C575F',
  },

  rectangleValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0060FF',
  },

  timerContainer: {
    position: 'absolute',
    top: 145,
    alignSelf: 'center',
  },

  board: {
    position: 'absolute',
    top: 212,
    width: 354,
    height: 354,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 6,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
  },

  cell: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#C7D5DF',
    backgroundColor: '#FFFFFF',
    margin: 1,
    borderRadius: 6,
  },

  controlsRow: {
    position: 'absolute',
    bottom: 50,
    width: 240,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  gradientButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },

  iconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});
