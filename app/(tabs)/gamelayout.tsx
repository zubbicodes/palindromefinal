import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Image,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { Switch } from 'react-native-switch';
import GameLayoutWeb from './gamelayout.web';

// ✅ Import theme context
import { useThemeContext } from '@/context/ThemeContext';
import { firebaseService } from '@/firebaseService';
import { useSound } from '@/hooks/use-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_GRADIENTS = [
  ['#C40111', '#F01D2E'],
  ['#757F35', '#99984D'],
  ['#1177FE', '#48B7FF'],
  ['#111111', '#3C3C3C'],
  ['#E7CC01', '#E7E437'],
] as const;

type BoardLayout = { x: number; y: number; width: number; height: number };

const DraggableBlock = ({
  index,
  gradient,
  blockCount,
  boardLayout,
  measureBoardLayout,
  gridSize,
  onDrop,
  onPickup,
  onDragUpdate
}: {
  index: number;
  gradient: readonly [string, string];
  blockCount: number;
  boardLayout: BoardLayout | null;
  measureBoardLayout: () => Promise<BoardLayout | null>;
  gridSize: number;
  onDrop: (row: number, col: number, colorIndex: number) => void;
  onPickup: () => void;
  onDragUpdate: (row: number | null, col: number | null) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isDragging, setIsDragging] = useState(false);

  const latest = useRef({
    boardLayout,
    blockCount,
    gridSize,
    measureBoardLayout,
    onDragUpdate,
    onDrop,
    onPickup,
  });

  useEffect(() => {
    latest.current = {
      boardLayout,
      blockCount,
      gridSize,
      measureBoardLayout,
      onDragUpdate,
      onDrop,
      onPickup,
    };
  }, [boardLayout, blockCount, gridSize, measureBoardLayout, onDragUpdate, onDrop, onPickup]);

  const getCellFromPoint = (touchX: number, touchY: number, layout: BoardLayout) => {
    const boardPadding = 6;
    const cellMargin = 1.5;
    const cellWidth = 27;
    const cellHeight = 30;
    const stepX = cellWidth + cellMargin * 2;
    const stepY = cellHeight + cellMargin * 2;

    const innerWidth = Math.max(1, layout.width - boardPadding * 2);
    const innerHeight = Math.max(1, layout.height - boardPadding * 2);
    const gridPixelWidth = latest.current.gridSize * stepX;
    const gridPixelHeight = latest.current.gridSize * stepY;

    const extraX = Math.max(0, (innerWidth - gridPixelWidth) / 2);
    const extraY = Math.max(0, innerHeight - gridPixelHeight) > 0.5 ? Math.max(0, (innerHeight - gridPixelHeight) / 2) : 0;

    const originX = layout.x + boardPadding + extraX + cellMargin;
    const originY = layout.y + boardPadding + extraY + cellMargin;

    const localX = touchX - originX;
    const localY = touchY - originY;
    const col = Math.floor(localX / stepX);
    const row = Math.floor(localY / stepY);

    if (row < 0 || row >= latest.current.gridSize || col < 0 || col >= latest.current.gridSize) {
      return { row: null, col: null };
    }
    return { row, col };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.blockCount > 0,
      onPanResponderGrant: () => {
        setIsDragging(true);
        latest.current.onPickup();
      },
      onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        const layout = latest.current.boardLayout;
        if (!layout) return;

        const touchX = (e.nativeEvent as any).pageX ?? gestureState.moveX;
        const touchY = (e.nativeEvent as any).pageY ?? gestureState.moveY;
        const { row, col } = getCellFromPoint(touchX, touchY, layout);
        latest.current.onDragUpdate(row, col);
      },
      onPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        setIsDragging(false);
        const dropX = (e.nativeEvent as any).pageX ?? gestureState.moveX;
        const dropY = (e.nativeEvent as any).pageY ?? gestureState.moveY;

        void (async () => {
          const measuredLayout = await latest.current.measureBoardLayout();
          const layoutToUse = measuredLayout ?? latest.current.boardLayout;
          if (!layoutToUse) return;
          const { row, col } = getCellFromPoint(dropX, dropY, layoutToUse);
          if (row !== null && col !== null) {
            latest.current.onDrop(row, col, index);
          }
        })();

        latest.current.onDragUpdate(null, null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        latest.current.onDragUpdate(null, null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    })
  ).current;

  return (
    <View style={styles.colorBlockWrapper}>
      {/* Background stack - stays behind */}
      <View style={[styles.colorBlock, { opacity: blockCount > 0 ? 1 : 0.5 }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientColorBlock}
        >
          <Text style={styles.blockText}>{blockCount}</Text>
        </LinearGradient>
      </View>

      {/* Floating draggable block */}
      <Animated.View
        style={[
          styles.colorBlock,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            transform: pan.getTranslateTransform(),
            zIndex: isDragging ? 1000 : 1,
            elevation: isDragging ? 10 : 0,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientColorBlock}
        >
          {/* Hide number when dragging for "picking one" look */}
          {!isDragging && <Text style={styles.blockText}>{blockCount}</Text>}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

function GameLayoutNative() {
  // ✅ Get theme and toggle function from context
  const { theme, toggleTheme } = useThemeContext();
  const { playPickupSound, playDropSound, playErrorSound } = useSound();

  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [pause, setPause] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // ✅ Local state sync with context
  const [darkModeEnabled, setDarkModeEnabled] = useState(theme === 'dark');
  const [userName, setUserName] = useState('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Game Logic State
  const gridSize = 11;
  const [gridState, setGridState] = useState<(number | null)[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  );
  const [blockCounts, setBlockCounts] = useState<number[]>([16, 16, 16, 16, 16]);
  const [activeHint, setActiveHint] = useState<{ row: number; col: number; colorIndex: number } | null>(null);
  const [feedback, setFeedback] = useState<{ text: string, color: string, id: number } | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [, setSecondsElapsed] = useState(0);
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);
  const [, setDraggedColor] = useState<number | null>(null);

  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);
  const boardRef = useRef<View | null>(null);
  const gridStateRef = useRef(gridState);
  const blockCountsRef = useRef(blockCounts);
  const hintsRef = useRef(hints);

  useEffect(() => {
    gridStateRef.current = gridState;
  }, [gridState]);

  useEffect(() => {
    blockCountsRef.current = blockCounts;
  }, [blockCounts]);

  useEffect(() => {
    hintsRef.current = hints;
  }, [hints]);

  const measureBoardLayout = useCallback((): Promise<BoardLayout | null> => {
    return new Promise((resolve) => {
      const node = boardRef.current as any;
      if (!node?.measureInWindow) {
        resolve(null);
        return;
      }
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        resolve({ x, y, width, height });
      });
    });
  }, []);

  const center = Math.floor(gridSize / 2);
  const word = 'PALINDROME';
  const halfWord = Math.floor(word.length / 2);

  const spawnBulldogs = useCallback(() => {
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
  }, [center, gridSize, halfWord, word]);

  useEffect(() => {
    spawnBulldogs();

    // Pre-place 3 random colors matching web logic
    const indPositions = [
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
    ];
    const initialColors = indPositions.map(() => Math.floor(Math.random() * 5));

    setGridState(prev => {
      const newGrid = prev.map(r => [...r]);
      indPositions.forEach((pos, idx) => {
        newGrid[pos.row][pos.col] = initialColors[idx];
      });
      return newGrid;
    });

    setBlockCounts(prev => {
      const next = [...prev];
      initialColors.forEach(colorIdx => {
        next[colorIdx] = Math.max(0, next[colorIdx] - 1);
      });
      return next;
    });
  }, [spawnBulldogs]);

  // Timer useEffect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && !pause) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          const mins = Math.floor(next / 60).toString().padStart(2, "0");
          const secs = (next % 60).toString().padStart(2, "0");
          setTime(`${mins}:${secs}`);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, pause]);

  // Fetch/Refresh user profile
  useEffect(() => {
    const fetchUserData = async () => {
      const user = firebaseService.getCurrentUser();
      if (user) {
        if (user.displayName) {
          setUserName(user.displayName);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }

        try {
          const storedAvatar = await AsyncStorage.getItem(`user_avatar_${user.uid}`);
          if (storedAvatar) {
            setProfileImage(storedAvatar);
          }
        } catch (error) {
          console.error('Error loading avatar in GameLayout:', error);
        }
      }
    };

    if (settingsVisible) {
      fetchUserData();
    }
    fetchUserData();
  }, [settingsVisible]);

  const checkAndProcessPalindromes = (row: number, col: number, colorIdx: number, currentGrid: (number | null)[][], dryRun = false, minLength = 3) => {
    let scoreFound = 0;

    const checkLine = (lineIsRow: boolean) => {
      const line: { color: number; r: number; c: number }[] = [];
      if (lineIsRow) {
        for (let c = 0; c < gridSize; c++) {
          line.push({ color: currentGrid[row][c] ?? -1, r: row, c: c });
        }
      } else {
        for (let r = 0; r < gridSize; r++) {
          line.push({ color: currentGrid[r][col] ?? -1, r: r, c: col });
        }
      }

      const targetIndex = lineIsRow ? col : row;
      let start = targetIndex;
      let end = targetIndex;

      while (start > 0 && line[start - 1].color !== -1) start--;
      while (end < gridSize - 1 && line[end + 1].color !== -1) end++;

      const segment = line.slice(start, end + 1);
      if (segment.length >= minLength) {
        const colorsArr = segment.map((s) => s.color);
        const isPal = colorsArr.join(",") === [...colorsArr].reverse().join(",");

        if (isPal) {
          let segmentScore = segment.length;
          let hasBulldog = false;
          segment.forEach((b) => {
            if (bulldogPositions.some((bp) => bp.row === b.r && bp.col === b.c)) {
              hasBulldog = true;
            }
          });

          if (hasBulldog) segmentScore += 10;
          scoreFound += segmentScore;

          if (!dryRun) {
            let feedbackText = "GOOD!";
            let feedbackColor = "#4ADE80";
            if (segment.length === 4) {
              feedbackText = "GREAT!";
              feedbackColor = "#60A5FA";
            } else if (segment.length === 5) {
              feedbackText = "AMAZING!";
              feedbackColor = "#A78BFA";
            } else if (segment.length >= 6) {
              feedbackText = "LEGENDARY!";
              feedbackColor = "#F472B6";
            }

            setFeedback({ text: feedbackText, color: feedbackColor, id: Date.now() });
            setTimeout(() => setFeedback(null), 2000);
          }
        }
      }
    };

    checkLine(true);
    checkLine(false);
    return scoreFound;
  };

  const findHint = () => {
    if (hintsRef.current <= 0) return;
    const colorGradientsCount = 5;

    const tryFindHint = (minLength: number) => {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (gridStateRef.current[r][c] === null) {
            for (let colorIdx = 0; colorIdx < colorGradientsCount; colorIdx++) {
              if (blockCountsRef.current[colorIdx] > 0) {
                const tempGrid = gridStateRef.current.map((rowArr) => [...rowArr]);
                tempGrid[r][c] = colorIdx;
                const sc = checkAndProcessPalindromes(r, c, colorIdx, tempGrid, true, minLength);
                if (sc > 0) {
                  setHints((prev) => prev - 1);
                  setActiveHint({ row: r, col: c, colorIndex: colorIdx });
                  setTimeout(() => setActiveHint(null), 3000);
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    };

    if (tryFindHint(3)) return;
    if (tryFindHint(2)) return;
    playErrorSound();
  };

  const handleDrop = (row: number, col: number, colorIndex: number) => {
    setDragOverCell(null);
    setDraggedColor(null);

    if (gridStateRef.current[row][col] !== null) {
      playErrorSound();
      return;
    }

    if (blockCountsRef.current[colorIndex] <= 0) {
      playErrorSound();
      return;
    }

    const newGrid = gridStateRef.current.map((r) => [...r]);
    newGrid[row][col] = colorIndex;
    setGridState(newGrid);

    setBlockCounts((prev) => {
      const next = [...prev];
      next[colorIndex] = Math.max(0, next[colorIndex] - 1);
      return next;
    });

    playDropSound();
    const scoreFound = checkAndProcessPalindromes(row, col, colorIndex, newGrid);
    if (scoreFound > 0) setScore((prev) => prev + scoreFound);
  };


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
              (dragOverCell?.row === row && dragOverCell?.col === col) && {
                backgroundColor: theme === 'dark' ? 'rgba(100, 200, 255, 0.4)' : 'rgba(100, 200, 255, 0.3)',
                borderColor: '#4A9EFF',
                borderWidth: 2,
              }
              ,
              (activeHint?.row === row && activeHint?.col === col) && {
                backgroundColor: theme === 'dark' ? 'rgba(100, 200, 255, 0.4)' : 'rgba(100, 200, 255, 0.3)',
                borderColor: '#FFD700',
                borderWidth: 2,
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 3,
              },
            ]}
            onPress={() => {
              if (isBulldog) {
                setScore(prev => prev + 5);
                spawnBulldogs();
              }
            }}
          >
            {gridState[row][col] !== null && (
              <LinearGradient
                colors={COLOR_GRADIENTS[gridState[row][col]!]}
                style={StyleSheet.absoluteFill}
              />
            )}
            {activeHint?.row === row && activeHint?.col === col && (
              <LinearGradient
                colors={COLOR_GRADIENTS[activeHint.colorIndex]}
                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
              />
            )}
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


  const blocks = COLOR_GRADIENTS.map((gradient, index) => (
    <DraggableBlock
      key={index}
      index={index}
      gradient={gradient}
      blockCount={blockCounts[index]}
      boardLayout={boardLayout}
      measureBoardLayout={measureBoardLayout}
      gridSize={gridSize}
      onDrop={handleDrop}
      onPickup={() => {
        playPickupSound();
        setDraggedColor(index);
        if (!isTimerRunning) setIsTimerRunning(true);
      }}
      onDragUpdate={(row: number | null, col: number | null) => {
        if (row !== null && col !== null) {
          if (gridState[row][col] === null) {
            setDragOverCell({ row, col });
          } else {
            setDragOverCell(null);
          }
        } else {
          setDragOverCell(null);
        }
      }}
    />
  ));

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
        PALINDROME®
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

      <Pressable
        onPress={findHint}
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
      </Pressable>

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
        ref={boardRef}
      onLayout={() => {
        boardRef.current?.measureInWindow((x, y, width, height) => {
          setBoardLayout({ x, y, width, height });
        });
      }}
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

      {/* Feedback Overlay */}
      {feedback && (
        <View
          pointerEvents="none"
          style={styles.feedbackContainer}
        >
          <Text style={[styles.feedbackText, { color: feedback.color }]}>
            {feedback.text}
          </Text>
        </View>
      )}

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
                    source={profileImage ? { uri: profileImage } : require('../../assets/images/profile.jpg')}
                    style={styles.profileImage}
                  />
                  <View style={styles.profileTextContainer}>
                    <Text
                      style={[
                        styles.profileName,
                        { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      {userName}
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

export default function GameLayout() {
  if (Platform.OS === 'web') return <GameLayoutWeb />;
  return <GameLayoutNative />;
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
  colorBlock: { width: 50, height: 50, borderRadius: 8 },
  colorBlockWrapper: { width: 50, height: 50, marginHorizontal: 4 },
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

  feedbackContainer: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    zIndex: 9999,
  },
  feedbackText: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});
