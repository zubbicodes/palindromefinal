import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';

export default function GameLayout() {
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [remainingBlocks, setRemainingBlocks] = useState(5); // start with 5 color blocks

  const handlePlay = () => {
    setScore(prev => prev + 1);
  };

  const spawnBulldogs = () => {
    const totalBulldogs = 5;
    const newPositions = Array.from({ length: totalBulldogs }, () => ({
      row: Math.floor(Math.random() * 11),
      col: Math.floor(Math.random() * 11),
    }));
    setBulldogPositions(newPositions);
  };

  useEffect(() => {
    spawnBulldogs();
  }, []);

  const gridSize = 11;
  const center = Math.floor(gridSize / 2);
  const word = 'PALINDROME';
  const halfWord = Math.floor(word.length / 2);

  // 🧩 Generate 11x11 grid with PALINDROME centered horizontally & vertically
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
            style={styles.cell}
            onPress={() => {
              if (isBulldog) {
                setScore(prev => prev + 5);
                spawnBulldogs();
              } else {
                handlePlay();
              }
            }}
          >
            {isBulldog && (
              <Image
                source={require('../../assets/images/bulldog.png')}
                style={styles.bulldogImage}
                resizeMode="contain"
              />
            )}
            {letter && <Text style={styles.letterText}>{letter}</Text>}
            <View style={styles.innerShadow} />
          </Pressable>
        );
      })}
    </View>
  ));

  // 🎨 Color blocks setup
  const colors = [
    ['#C40111', '#F01D2E'],
    ['#757F35', '#99984D'],
    ['#1177FE', '#48B7FF'],
    ['#111111', '#3C3C3C'],
    ['#E7CC01', '#E7E437'],
  ] as const;

  // Drag + Drop logic
  const blocks = colors.map((gradient, index) => {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();

          // 🧮 Decrease remaining blocks when dropped
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

      {/* Center Timer */}
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

      {/* 🎨 Color Blocks Row */}
      <View style={styles.colorBlocksContainer}>
        <View style={styles.colorBlocksRow}>{blocks}</View>
      </View>

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
    backgroundColor: '#E4EBF0',
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
    borderColor: '#CCDAE466',
    backgroundColor: '#FFFFFF',
    margin: 1.5,
    borderRadius: 6,
    shadowColor: '#00000026',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  letterText: {
    fontFamily: 'Geist-Bold',
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },

  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    shadowColor: '#00000033',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  bulldogImage: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: 4,
    left: 4,
  },

  colorBlocksContainer: {
    position: 'absolute',
    top: 585, // adjust this value to move it up/down
    width: 320,
    height: 70,
    backgroundColor: '#E4EBF0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  colorBlocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
  },

  colorBlock: {
  width: 50,
  height: 50,
  borderRadius: 8,
  marginHorizontal: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 3, // for Android
},


  gradientColorBlock: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  blockText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
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
});
