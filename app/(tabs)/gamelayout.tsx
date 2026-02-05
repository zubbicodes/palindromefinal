import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Image,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpotlightTourProvider, type TourState, type TourStep } from 'react-native-spotlight-tour';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { Switch } from 'react-native-switch';

// ✅ Import theme context
import { authService } from '@/authService';
import { ColorBlindMode, useSettings } from '@/context/SettingsContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useSound } from '@/hooks/use-sound';
import { createInitialState } from '@/lib/gameEngine';
import { getMatch, subscribeToMatch, submitScore, type Match, type MatchPlayer } from '@/lib/matchmaking';

const COLOR_GRADIENTS = [
  ['#C40111', '#F01D2E'],
  ['#757F35', '#99984D'],
  ['#1177FE', '#48B7FF'],
  ['#111111', '#3C3C3C'],
  ['#E7CC01', '#E7E437'],
] as const;

const COLOR_BLIND_TOKENS: Record<ColorBlindMode, readonly string[]> = {
  symbols: ['●', '▲', '■', '◆', '★'],
  emojis: ['🍓', '🥑', '🫐', '🖤', '🍋'],
  cards: ['♥', '♣', '♦', '♠', '★'],
  letters: ['A', 'B', 'C', 'D', 'E'],
} as const;

function getColorBlindToken(mode: ColorBlindMode, index: number) {
  return COLOR_BLIND_TOKENS[mode][index] ?? '?';
}

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
  const { colorBlindEnabled, colorBlindMode } = useSettings();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isDragging, setIsDragging] = useState(false);
  const token = colorBlindEnabled ? getColorBlindToken(colorBlindMode, index) : null;
  const lastDragCellRef = useRef<{ row: number | null; col: number | null }>({ row: null, col: null });
  const dragTargetOffsetY = 50;

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
        lastDragCellRef.current = { row: null, col: null };
        latest.current.onPickup();
      },
      onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        const layout = latest.current.boardLayout;
        if (!layout) return;

        const touchX = (e.nativeEvent as any).pageX ?? gestureState.moveX;
        const touchY = (e.nativeEvent as any).pageY ?? gestureState.moveY;
        const { row, col } = getCellFromPoint(touchX, touchY - dragTargetOffsetY, layout);

        const last = lastDragCellRef.current;
        if (last.row === row && last.col === col) return;
        lastDragCellRef.current = { row, col };
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
          const { row, col } = getCellFromPoint(dropX, dropY - dragTargetOffsetY, layoutToUse);
          if (row !== null && col !== null) {
            latest.current.onDrop(row, col, index);
          }
        })();

        lastDragCellRef.current = { row: null, col: null };
        latest.current.onDragUpdate(null, null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        lastDragCellRef.current = { row: null, col: null };
        latest.current.onDragUpdate(null, null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
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
          {token ? <Text style={styles.colorBlindBlockToken}>{token}</Text> : null}
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
          {token ? <Text style={styles.colorBlindBlockToken}>{token}</Text> : null}
          {!isDragging && <Text style={styles.blockText}>{blockCount}</Text>}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const PaletteBlock = ({
  index,
  gradient,
  blockCount,
  selected,
  onPress,
}: {
  index: number;
  gradient: readonly [string, string];
  blockCount: number;
  selected: boolean;
  onPress: () => void;
}) => {
  const { colorBlindEnabled, colorBlindMode } = useSettings();
  const token = colorBlindEnabled ? getColorBlindToken(colorBlindMode, index) : null;
  const disabled = blockCount <= 0;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.colorBlockWrapper}>
      <View
        style={[
          styles.colorBlock,
          {
            opacity: disabled ? 0.5 : 1,
            borderWidth: selected ? 2 : 0,
            borderColor: selected ? '#4A9EFF' : 'transparent',
          },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientColorBlock}
        >
          {token ? <Text style={styles.colorBlindBlockToken}>{token}</Text> : null}
          <Text style={styles.blockText}>{blockCount}</Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const GAME_TUTORIAL_SEEN_KEY = 'palindrome_game_tutorial_v1_seen';

function TourCard(props: {
  title: string;
  description: string;
  stepIndex: number;
  stepsCount: number;
  isDark: boolean;
  accentColor: string;
  isFirst: boolean;
  isLast: boolean;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View
      style={{
        width: 360,
        maxWidth: '100%',
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
          {props.title}
        </Text>
        <Text
          style={{
            fontFamily: 'Geist-Regular',
            fontSize: 12,
            color: props.isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,17,17,0.55)',
          }}
        >
          {Math.min(props.stepIndex + 1, props.stepsCount)}/{props.stepsCount}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 8,
          fontFamily: 'Geist-Regular',
          fontSize: 13,
          lineHeight: 18,
          color: props.isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.78)',
        }}
      >
        {props.description}
      </Text>

      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={props.onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip tutorial"
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
            disabled={props.isFirst}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: props.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.16)',
              opacity: props.isFirst ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: props.isDark ? '#FFFFFF' : '#111111' }}>
              Back
            </Text>
          </Pressable>

          <Pressable
            onPress={props.onNext}
            accessibilityRole="button"
            accessibilityLabel={props.isLast ? 'Finish tutorial' : 'Next step'}
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

function GameTourSpotSync(props: {
  tour: any;
  topInset: number;
  scoreBoxRef: React.RefObject<View | null>;
  timerBoxRef: React.RefObject<View | null>;
  hintsBoxRef: React.RefObject<View | null>;
  blocksBoxRef: React.RefObject<View | null>;
  boardRef: React.RefObject<View | null>;
  controlsRowRef: React.RefObject<View | null>;
}) {
  const { current, status, changeSpot } = props.tour ?? {};
  const { scoreBoxRef, timerBoxRef, hintsBoxRef, blocksBoxRef, boardRef, controlsRowRef } = props;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const yOffset = props.topInset;

  useEffect(() => {
    if (status !== 'running') return;
    if (typeof current !== 'number') return;

    let cancelled = false;

    const measure = (node: any) => {
      return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
        if (!node?.measureInWindow) return resolve(null);
        node.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) resolve({ x, y, width, height });
          else resolve(null);
        });
      });
    };

    const run = async () => {
      const getRef = () =>
        current === 0
          ? scoreBoxRef
          : current === 1
            ? timerBoxRef
            : current === 2
              ? hintsBoxRef
              : current === 3
                ? blocksBoxRef
                : current === 4
                  ? boardRef
                  : controlsRowRef;

      let didSet = false;
      const delays = [0, 40, 90, 160, 260, 420];
      for (const d of delays) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, d)));
        if (cancelled) return;
        const ref = getRef();
        const node = (ref as any)?.current as any;
        const rect = await measure(node);
        if (!rect) continue;
        changeSpot({ ...rect, y: rect.y + yOffset });
        didSet = true;
        break;
      }

      if (!didSet && typeof changeSpot === 'function') {
        const x = Math.max(0, windowWidth / 2 - 2);
        const y = Math.max(0, windowHeight / 2 - 2 + yOffset);
        changeSpot({ x, y, width: 4, height: 4 });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [blocksBoxRef, boardRef, changeSpot, controlsRowRef, current, hintsBoxRef, scoreBoxRef, status, timerBoxRef, windowHeight, windowWidth, yOffset]);

  return null;
}

export default function GameLayout() {
  const { matchId: routeMatchId } = useLocalSearchParams<{ matchId?: string }>();
  const matchId = typeof routeMatchId === 'string' ? routeMatchId : undefined;

  // ✅ Get theme and toggle function from context
  const { theme, toggleTheme, colors } = useThemeContext();
  const { soundEnabled, hapticsEnabled, colorBlindEnabled, colorBlindMode, interactionMode, setSoundEnabled, setHapticsEnabled, setColorBlindEnabled, setInteractionMode } = useSettings();
  const { playPickupSound, playDropSound, playErrorSound, playSuccessSound } = useSound();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const settingsCardHeight = Math.min(windowHeight * 0.78, windowHeight - insets.top - insets.bottom - 48);

  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(2);
  const [time, setTime] = useState('00:00');
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([]);
  const [pause, setPause] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const tourRef = useRef<any>(null);

  const [multiplayerMatch, setMultiplayerMatch] = useState<Match | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [multiplayerTimeLimit, setMultiplayerTimeLimit] = useState<number | null>(null);
  const [multiplayerStartedAt, setMultiplayerStartedAt] = useState<string | null>(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const multiplayerInitDone = useRef(false);

  const scoreBoxRef = useRef<View | null>(null);
  const hintsBoxRef = useRef<View | null>(null);
  const timerBoxRef = useRef<View | null>(null);
  const blocksBoxRef = useRef<View | null>(null);
  const playBtnRef = useRef<View | null>(null);
  const pauseBtnRef = useRef<View | null>(null);
  const profileBtnRef = useRef<View | null>(null);
  const settingsBtnRef = useRef<View | null>(null);
  const controlsRowRef = useRef<View | null>(null);

  // ✅ Local state sync with context
  const [darkModeEnabled, setDarkModeEnabled] = useState(theme === 'dark');
  const [userName, setUserName] = useState('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pickTargetCell, setPickTargetCell] = useState<{ row: number; col: number } | null>(null);
  const [pickSelectedColor, setPickSelectedColor] = useState<number | null>(null);
  const noHintsAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = useCallback((kind: 'pickup' | 'drop' | 'error' | 'success') => {
    if (!hapticsEnabled) return;
    try {
      if (kind === 'error') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (kind === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      return;
    }
  }, [hapticsEnabled]);

  const markTourSeen = useCallback(() => {
    void AsyncStorage.setItem(GAME_TUTORIAL_SEEN_KEY, '1');
  }, []);

  const flashNoHintsFace = useCallback(() => {
    noHintsAnim.stopAnimation();
    noHintsAnim.setValue(0);
    Animated.sequence([
      Animated.timing(noHintsAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(noHintsAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [noHintsAnim]);

  const openTutorial = useCallback(() => {
    tourRef.current?.start?.();
  }, []);

  const tourSteps = useMemo<TourStep[]>(() => {
    const stepsCount = 6;

    const step = (cfg: { title: string; description: string }): TourStep => {
      return {
        arrow: false,
        shape: { type: 'rectangle', padding: 10 },
        render: ({ current, isFirst, isLast, next, previous, stop }) => (
          <TourCard
            title={cfg.title}
            description={cfg.description}
            stepIndex={current}
            stepsCount={stepsCount}
            isDark={theme === 'dark'}
            accentColor={colors.accent}
            isFirst={isFirst}
            isLast={isLast}
            onSkip={stop}
            onBack={previous}
            onNext={isLast ? stop : next}
          />
        ),
      };
    };

    return [
      step({
        title: 'Score',
        description: 'Your score increases when you create palindromes. Longer lines score higher.',
      }),
      step({
        title: 'Timer',
        description: 'The timer starts with your first move. Use it to track your pace.',
      }),
      step({
        title: 'Hints',
        description: 'Use hints to highlight a strong move on the board when you get stuck.',
      }),
      step({
        title: 'Blocks',
        description: 'Drag a colored block from here onto an empty cell.',
      }),
      step({
        title: 'Game Board',
        description: 'Place blocks to form palindromes in a row or column (3+ blocks).',
      }),
      step({
        title: 'Controls',
        description: 'Play resumes, Pause stops the timer, Settings manages preferences.',
      }),
    ];
  }, [colors.accent, theme]);

  useEffect(() => {
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(GAME_TUTORIAL_SEEN_KEY);
        if (seen === '1') return;
        setTimeout(() => tourRef.current?.start?.(), 450);
      } catch {
        return;
      }
    })();
  }, []);

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
  const [wrongForcedTries, setWrongForcedTries] = useState(0);

  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);
  const boardRef = useRef<View | null>(null);
  const gridStateRef = useRef(gridState);
  const blockCountsRef = useRef(blockCounts);
  const hintsRef = useRef(hints);
  const wrongForcedTriesRef = useRef(wrongForcedTries);
  const scoreRef = useRef(score);

  useEffect(() => {
    gridStateRef.current = gridState;
  }, [gridState]);

  useEffect(() => {
    blockCountsRef.current = blockCounts;
  }, [blockCounts]);

  useEffect(() => {
    hintsRef.current = hints;
  }, [hints]);

  useEffect(() => {
    wrongForcedTriesRef.current = wrongForcedTries;
  }, [wrongForcedTries]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    setPickTargetCell(null);
    setPickSelectedColor(null);
    setDragOverCell(null);
    setDraggedColor(null);
  }, [interactionMode]);

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
  const word = ' PALINDROME';
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
    if (matchId) return;
    spawnBulldogs();

    // Pre-place 3 random colors matching web logic
    const indPositions = [
      { row: 6, col: 5 },
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
  }, [spawnBulldogs, matchId]);

  useEffect(() => {
    if (!matchId || multiplayerInitDone.current) return;
    let cancelled = false;
    (async () => {
      const m = await getMatch(matchId);
      if (cancelled || !m) return;
      multiplayerInitDone.current = true;
      setMultiplayerMatch(m);
      setMultiplayerTimeLimit(m.time_limit_seconds);
      setMultiplayerStartedAt(m.started_at ?? null);
      const initialState = createInitialState(m.seed);
      setGridState(initialState.grid.map(r => [...r]));
      setBlockCounts([...initialState.blockCounts]);
      setBulldogPositions([...initialState.bulldogPositions]);
      setScore(initialState.score);
      const user = await authService.getSessionUser();
      const other = (m.match_players ?? []).find((p: MatchPlayer) => p.user_id !== user?.id);
      if (other) setOpponentScore(other.score ?? 0);
    })();
    return () => { cancelled = true; };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribeToMatch(matchId, (m) => {
      setMultiplayerMatch(m);
      const me = authService.getSessionUser();
      void me.then(async (user) => {
        const other = (m.match_players ?? []).find((p: MatchPlayer) => p.user_id !== user?.id);
        if (other) {
          setOpponentScore(other.score ?? 0);
          const profile = await authService.getProfile(other.user_id);
          if (profile?.full_name) setOpponentName(profile.full_name);
          if (m.status === 'finished') {
            router.replace({ pathname: '/matchresult' as any, params: { matchId: m.id } });
          }
        }
      });
    });
    return unsub;
  }, [matchId, router]);

  // Timer useEffect (single player: count up)
  useEffect(() => {
    if (matchId) return;
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
  }, [matchId, isTimerRunning, pause]);

  // Multiplayer: countdown from started_at + time_limit_seconds
  useEffect(() => {
    if (!matchId || !multiplayerStartedAt || multiplayerTimeLimit == null || scoreSubmitted) return;
    const started = new Date(multiplayerStartedAt).getTime();
    const endAt = started + multiplayerTimeLimit * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toString().padStart(2, '0');
      setTime(`${mins}:${secs}`);
      if (remaining <= 0) {
        setScoreSubmitted(true);
        authService.getSessionUser().then((user) => {
          if (user) submitScore(matchId, user.id, scoreRef.current);
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [matchId, multiplayerStartedAt, multiplayerTimeLimit, scoreSubmitted]);

  // Fetch/Refresh user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getSessionUser();
        if (user) {
          // Try to load from cache first
          const cached = await authService.getCachedProfile(user.id);
          if (cached) {
            setUserName(cached.full_name || user.email?.split('@')[0] || 'User');
            setProfileImage(cached.avatar_url);
          }

          // Fetch fresh profile data
          const profile = await authService.getProfile(user.id);
          if (profile) {
            setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
            setProfileImage(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile in game settings:', error);
      }
    };

    if (settingsVisible) {
      fetchProfile();
    }
    // Initial fetch on mount as well
    fetchProfile();
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

            triggerHaptic('success');
            playSuccessSound();
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

  const findFirstScoringMove = (minLength: number) => {
    const colorGradientsCount = 5;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (gridStateRef.current[r][c] !== null) continue;
        for (let colorIdx = 0; colorIdx < colorGradientsCount; colorIdx++) {
          if (blockCountsRef.current[colorIdx] <= 0) continue;
          const tempGrid = gridStateRef.current.map((rowArr) => [...rowArr]);
          tempGrid[r][c] = colorIdx;
          const sc = checkAndProcessPalindromes(r, c, colorIdx, tempGrid, true, minLength);
          if (sc > 0) {
            return { row: r, col: c, colorIndex: colorIdx };
          }
        }
      }
    }
    return null;
  };

  const findHint = () => {
    if (hintsRef.current <= 0) return;
    const move = findFirstScoringMove(3) ?? findFirstScoringMove(2);
    if (move) {
      setHints((prev) => prev - 1);
      setActiveHint(move);
      setTimeout(() => setActiveHint(null), 3000);
      return;
    }
    playErrorSound();
    triggerHaptic('error');
  };

  const handleDrop = (row: number, col: number, colorIndex: number) => {
    setDragOverCell(null);
    setDraggedColor(null);

    if (gridStateRef.current[row][col] !== null) {
      playErrorSound();
      triggerHaptic('error');
      return false;
    }

    if (blockCountsRef.current[colorIndex] <= 0) {
      playErrorSound();
      triggerHaptic('error');
      return false;
    }

    const forcedMove = findFirstScoringMove(3);
    if (forcedMove) {
      const tempGrid = gridStateRef.current.map((r) => [...r]);
      tempGrid[row][col] = colorIndex;
      const attemptedScore = checkAndProcessPalindromes(row, col, colorIndex, tempGrid, true, 3);

      if (attemptedScore <= 0) {
        const nextWrongTries = wrongForcedTriesRef.current + 1;
        const nextValue = nextWrongTries >= 3 ? 0 : nextWrongTries;
        wrongForcedTriesRef.current = nextValue;
        setWrongForcedTries(nextValue);

        playErrorSound();
        triggerHaptic('error');

        if (nextWrongTries >= 3) {
          if (hintsRef.current > 0) {
            setHints((prev) => Math.max(0, prev - 1));
            setActiveHint(forcedMove);
            setTimeout(() => setActiveHint(null), 3000);
          } else {
            flashNoHintsFace();
          }
        }
        return false;
      }
    } else if (wrongForcedTriesRef.current !== 0) {
      wrongForcedTriesRef.current = 0;
      setWrongForcedTries(0);
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
    triggerHaptic('drop');
    const scoreFound = checkAndProcessPalindromes(row, col, colorIndex, newGrid);
    if (scoreFound > 0) setScore((prev) => prev + scoreFound);
    if (wrongForcedTriesRef.current !== 0) {
      wrongForcedTriesRef.current = 0;
      setWrongForcedTries(0);
    }
    return true;
  };

  const handlePickColor = (colorIndex: number) => {
    if (interactionMode !== 'pick') return;
    if (!pickTargetCell) {
      playErrorSound();
      triggerHaptic('error');
      return;
    }

    setPickSelectedColor(colorIndex);
    playPickupSound();
    triggerHaptic('pickup');
    if (!isTimerRunning) setIsTimerRunning(true);

    const didPlace = handleDrop(pickTargetCell.row, pickTargetCell.col, colorIndex);
    if (didPlace) {
      setPickTargetCell(null);
    }
    setTimeout(() => setPickSelectedColor(null), 150);
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
              (interactionMode === 'pick' && pickTargetCell?.row === row && pickTargetCell?.col === col) && {
                backgroundColor: theme === 'dark' ? 'rgba(100, 200, 255, 0.25)' : 'rgba(100, 200, 255, 0.18)',
                borderColor: '#4A9EFF',
                borderWidth: 2,
              },
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
              if (interactionMode === 'pick') {
                if (gridStateRef.current[row][col] !== null) {
                  playErrorSound();
                  triggerHaptic('error');
                  return;
                }
                setPickTargetCell((prev) => {
                  if (prev?.row === row && prev?.col === col) return null;
                  return { row, col };
                });
                triggerHaptic('pickup');
                return;
              }
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
            {activeHint?.row === row && activeHint?.col === col && colorBlindEnabled && (
              <View pointerEvents="none" style={styles.colorBlindTokenOverlay}>
                <Text style={styles.colorBlindTokenText}>
                  {getColorBlindToken(colorBlindMode, activeHint.colorIndex)}
                </Text>
              </View>
            )}
            {gridState[row][col] !== null && colorBlindEnabled && !letter && (
              <View pointerEvents="none" style={styles.colorBlindTokenOverlay}>
                <Text style={styles.colorBlindTokenText}>
                  {getColorBlindToken(colorBlindMode, gridState[row][col]!)}
                </Text>
              </View>
            )}
            {gridState[row][col] !== null && colorBlindEnabled && letter && (
              <Text style={styles.colorBlindTokenCorner}>
                {getColorBlindToken(colorBlindMode, gridState[row][col]!)}
              </Text>
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
    interactionMode === 'pick' ? (
      <PaletteBlock
        key={index}
        index={index}
        gradient={gradient}
        blockCount={blockCounts[index]}
        selected={pickSelectedColor === index}
        onPress={() => handlePickColor(index)}
      />
    ) : (
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
          triggerHaptic('pickup');
          setDraggedColor(index);
          if (!isTimerRunning) setIsTimerRunning(true);
        }}
        onDragUpdate={(row: number | null, col: number | null) => {
          setDragOverCell((prev) => {
            if (row === null || col === null) return prev ? null : prev;
            const isEmpty = gridStateRef.current[row]?.[col] === null;
            if (!isEmpty) return prev ? null : prev;
            if (prev?.row === row && prev?.col === col) return prev;
            return { row, col };
          });
        }}
      />
    )
  ));

  return (
    <SpotlightTourProvider
      ref={tourRef}
      steps={tourSteps}
      overlayColor={'#000000'}
      overlayOpacity={0.72}
      arrow={false}
      shape={{ type: 'rectangle', padding: 10 }}
      onBackdropPress={() => {}}
      onStop={(_values: TourState) => markTourSeen()}
    >
    {(tour) => (
      <>
        <GameTourSpotSync
          tour={tour}
          topInset={insets.top}
          scoreBoxRef={scoreBoxRef}
          timerBoxRef={timerBoxRef}
          hintsBoxRef={hintsBoxRef}
          blocksBoxRef={blocksBoxRef}
          boardRef={boardRef}
          controlsRowRef={controlsRowRef}
        />
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

      {matchId ? (
        <View
          style={[
            styles.opponentBar,
            {
              backgroundColor: theme === 'dark' ? 'rgba(25,25,91,0.5)' : 'rgba(229,236,241,0.6)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#C7D5DF',
            },
          ]}
        >
          <Text style={[styles.opponentLabel, { color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : '#4C575F' }]}>
            {opponentName}
          </Text>
          <Text style={[styles.opponentScore, { color: theme === 'dark' ? '#FFFFFF' : '#0060FF' }]}>
            {opponentScore ?? '—'}
          </Text>
        </View>
      ) : null}

      <View
        ref={scoreBoxRef}
        collapsable={false}
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
        ref={hintsBoxRef as any}
        collapsable={false}
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
        <View style={{ position: 'relative', height: 28, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Text
            style={[
              styles.rectangleValue,
              {
                color: '#C35DD9',
                position: 'absolute',
                opacity: noHintsAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [{ scale: noHintsAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) }],
              },
            ]}
          >
            {hints}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.rectangleValue,
              {
                color: '#C35DD9',
                position: 'absolute',
                opacity: noHintsAnim,
                transform: [{ scale: noHintsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
              },
            ]}
          >
            (¬_¬)
          </Animated.Text>
        </View>
      </Pressable>

      <View ref={timerBoxRef} collapsable={false} style={styles.timerContainer}>
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
        collapsable={false}
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
        {feedback && (
          <View pointerEvents="none" style={styles.feedbackContainer}>
            <Text style={[styles.feedbackText, { color: feedback.color }]}>
              {feedback.text}
            </Text>
          </View>
        )}
      </View>

      <View
        ref={blocksBoxRef}
        collapsable={false}
        style={[
          styles.colorBlocksContainer,
          { backgroundColor: theme === 'dark' ? 'rgba(25,25,91,0.7)' : '#E4EBF0' },
        ]}
      >
        <View style={styles.colorBlocksRow}>{blocks}</View>
      </View>

      <View ref={controlsRowRef} collapsable={false} style={styles.controlsRow}>
        <Pressable ref={playBtnRef as any} collapsable={false} onPress={() => console.log('Play')}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="play" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>

        <Pressable ref={pauseBtnRef as any} collapsable={false} onPress={() => setPause(true)}>
          <LinearGradient colors={['#ffee60', '#ffa40b']} style={styles.gradientButton}>
            <Ionicons name="pause" size={20} color="#de5f07" />
          </LinearGradient>
        </Pressable>

        <Pressable ref={profileBtnRef as any} collapsable={false} onPress={() => router.push('/profile')}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="list" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>

        <Pressable ref={settingsBtnRef as any} collapsable={false} onPress={() => setSettingsVisible(true)}>
          <LinearGradient colors={['#8ed9fc', '#3c8dea']} style={styles.gradientButton}>
            <Ionicons name="settings" size={20} color="#1a63cc" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={openTutorial}
        >
          <LinearGradient colors={['#111111', '#3C3C3C']} style={styles.gradientButton}>
            <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
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
                style={[styles.settingsCard, { padding: 20, borderRadius: 20, height: settingsCardHeight }]}
              >
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

                <ScrollView
                  style={styles.settingsScroll}
                  contentContainerStyle={styles.settingsScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.profileSection}>
                    <Image
                      source={profileImage ? { uri: profileImage } : require('../../assets/images/profile_ph.png')}
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

                  <View style={styles.optionRow}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      Sound Effects
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
                      Haptic Feedback
                    </Text>
                    <Switch
                      value={hapticsEnabled}
                      onValueChange={setHapticsEnabled}
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
                    <View style={{ flexDirection: 'column', flex: 1, paddingRight: 14 }}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                        ]}
                      >
                        Interaction Mode
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 4, color: theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }}>
                        {interactionMode === 'pick' ? 'Pick and Drop' : 'Drag and Drop'}
                      </Text>
                    </View>
                    <Switch
                      value={interactionMode === 'pick'}
                      onValueChange={(v) => setInteractionMode(v ? 'pick' : 'drag')}
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
                    <View style={{ flexDirection: 'column', flex: 1, paddingRight: 14 }}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: theme === 'dark' ? '#FFFFFF' : '#000000' },
                        ]}
                      >
                        Color Blind Mode
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 4, color: theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }}>
                        Preference: {colorBlindMode === 'symbols' ? 'Symbols' : colorBlindMode === 'emojis' ? 'Emojis' : colorBlindMode === 'cards' ? 'Cards' : 'Letters'}
                      </Text>
                    </View>
                    <Switch
                      value={colorBlindEnabled}
                      onValueChange={setColorBlindEnabled}
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
                        toggleTheme();
                        setDarkModeEnabled(prev => !prev);
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
                </ScrollView>
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
      </>
    )}
    </SpotlightTourProvider>
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
  opponentBar: {
    position: 'absolute',
    top: 88,
    left: 16,
    right: 16,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  opponentLabel: { fontSize: 13, fontFamily: 'Geist-Regular' },
  opponentScore: { fontSize: 18, fontFamily: 'Geist-Bold' },
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
  colorBlindBlockToken: { position: 'absolute', top: 6, left: 8, color: '#FFFFFF', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  colorBlindTokenOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2, justifyContent: 'center', alignItems: 'center' },
  colorBlindTokenText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  colorBlindTokenCorner: { position: 'absolute', zIndex: 2, bottom: 3, right: 4, color: '#FFFFFF', fontSize: 10, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  controlsRow: { position: 'absolute', top: 720, width: 300, flexDirection: 'row', justifyContent: 'space-around' },
  gradientButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  // ⚙️ Settings Styles
  settingsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  settingsCard: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
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
  settingsScroll: { flex: 1 },
  settingsScrollContent: { paddingBottom: 6 },
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
  },
});
