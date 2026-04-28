/**
 * Shared game engine for Palindrome - used by both native and web.
 * All board init, move validation, and scoring logic lives here.
 */

export const GRID_SIZE = 11;
export const NUM_COLORS = 5;
export const DEFAULT_BLOCK_COUNTS = [16, 16, 16, 16, 16] as const;
export const MIN_PALINDROME_LENGTH = 3;
const BULLDOG_BONUS = 10;

/** Center row/col for the PALINDROME word cross */
const CENTER = Math.floor(GRID_SIZE / 2);
const WORD = ' PALINDROME';
const HALF_WORD = Math.floor(WORD.length / 2);

/** Number of initial pre-placed blocks */
const INITIAL_BLOCK_COUNT = 3;

export type Grid = (number | null)[][];

export interface GameState {
  grid: Grid;
  blockCounts: number[];
  score: number;
  bulldogPositions: { row: number; col: number }[];
  moveCount: number;
}

export interface ScoredTile {
  color: number;
  r: number;
  c: number;
}

export interface ScoringResult {
  score: number;
  /** For UI feedback: segment length that scored (e.g. 3 = GOOD, 4 = GREAT, ...) */
  segmentLength?: number;
  segment?: ScoredTile[];
  kind?: 'row' | 'col' | 'rightAngle';
  hasBulldog?: boolean;
}

export interface HintMove {
  row: number;
  col: number;
  colorIndex: number;
}

import { createSeededRandom } from './seededRandom';

function getBlockedPositionsForBulldogs(): Set<string> {
  const blocked = new Set<string>();
  for (let i = 0; i < WORD.length; i++) {
    blocked.add(`${CENTER},${CENTER - HALF_WORD + i}`);
    blocked.add(`${CENTER - HALF_WORD + i},${CENTER}`);
  }
  return blocked;
}

function shuffleColors(rng: () => number): number[] {
  const availableColors = Array.from({ length: NUM_COLORS }, (_, i) => i);
  for (let i = availableColors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
  }
  return availableColors;
}

function createBulldogPositions(
  rng: () => number,
  blocked = getBlockedPositionsForBulldogs()
): { row: number; col: number }[] {
  const totalBulldogs = 5;
  const bulldogPositions: { row: number; col: number }[] = [];

  while (bulldogPositions.length < totalBulldogs) {
    const row = Math.floor(rng() * GRID_SIZE);
    const col = Math.floor(rng() * GRID_SIZE);
    const key = `${row},${col}`;
    if (
      !blocked.has(key) &&
      !bulldogPositions.some((p) => p.row === row && p.col === col)
    ) {
      bulldogPositions.push({ row, col });
    }
  }

  return bulldogPositions;
}

function createGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

/**
 * Create the unseeded single-player opener used by the main web game.
 */
export function createSinglePlayerInitialState(rng: () => number = Math.random): GameState {
  const bulldogPositions = createBulldogPositions(rng);
  const grid = createGrid();
  const initialPositions = [
    { row: 5, col: 3 },
    { row: 5, col: 4 },
    { row: 5, col: 5 },
  ];
  const initialColors = shuffleColors(rng).slice(0, INITIAL_BLOCK_COUNT);

  initialPositions.forEach((pos, idx) => {
    grid[pos.row][pos.col] = initialColors[idx];
  });

  const blockCounts = [...DEFAULT_BLOCK_COUNTS] as number[];
  initialColors.forEach((colorIdx) => {
    blockCounts[colorIdx] = Math.max(0, blockCounts[colorIdx] - 1);
  });

  return {
    grid,
    blockCounts,
    score: 0,
    bulldogPositions,
    moveCount: 0,
  };
}

/**
 * Create initial game state from a seed (deterministic for multiplayer).
 */
export function createInitialState(seed: string): GameState {
  const rng = createSeededRandom(seed);
  const blocked = getBlockedPositionsForBulldogs();
  const bulldogPositions = createBulldogPositions(rng, blocked);

  // Pick 2-3 colors for the starting horizontal palindrome setup
  // 50% chance: 3 different colors (player needs 2 blocks to make 5-counter)
  // 50% chance: 2 colors with one repeated (player can make 4-counter with 1 block)
  const useThreeColors = rng() < 0.5;
  const availableColors = shuffleColors(rng);
  
  const initialColors: number[] = [];
  if (useThreeColors) {
    // 3 different colors
    initialColors.push(availableColors[0], availableColors[1], availableColors[2]);
  } else {
    // 2 colors: first color repeated, second different
    // Pattern: A, B, A (to make it a palindrome-able setup)
    initialColors.push(availableColors[0], availableColors[1], availableColors[0]);
  }

  // Place them horizontally in a row (consecutive columns)
  // Pick a random row and starting column that avoids blocked positions
  let startRow: number;
  let startCol: number;
  let positionsValid = false;
  do {
    startRow = Math.floor(rng() * GRID_SIZE);
    startCol = Math.floor(rng() * (GRID_SIZE - INITIAL_BLOCK_COUNT + 1));
    positionsValid = true;
    for (let i = 0; i < INITIAL_BLOCK_COUNT; i++) {
      const key = `${startRow},${startCol + i}`;
      if (blocked.has(key) || bulldogPositions.some(p => p.row === startRow && p.col === startCol + i)) {
        positionsValid = false;
        break;
      }
    }
  } while (!positionsValid);

  const initialPositions = Array.from({ length: INITIAL_BLOCK_COUNT }, (_, i) => ({
    row: startRow,
    col: startCol + i,
  }));

  const grid = createGrid();
  initialPositions.forEach((pos, idx) => {
    grid[pos.row][pos.col] = initialColors[idx];
  });

  const blockCounts = [...DEFAULT_BLOCK_COUNTS] as number[];
  initialColors.forEach((colorIdx) => {
    blockCounts[colorIdx] = Math.max(0, blockCounts[colorIdx] - 1);
  });

  return {
    grid,
    blockCounts,
    score: 0,
    bulldogPositions,
    moveCount: 0,
  };
}

/**
 * Check row and column through (row, col) for palindromes. Pure function.
 * Returns score earned (0 if none). Optional segmentLength for UI feedback.
 */
export function checkPalindromes(
  grid: Grid,
  row: number,
  col: number,
  bulldogPositions: { row: number; col: number }[],
  minLength: number = MIN_PALINDROME_LENGTH
): ScoringResult {
  const isOdd = (n: number) => n % 2 === 1;
  const isInside = (r: number, c: number) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;

  const checkLine = (lineIsRow: boolean): { length: number; segment: ScoredTile[] | null } => {
    const line: ScoredTile[] = [];
    if (lineIsRow) {
      for (let c = 0; c < GRID_SIZE; c++) {
        line.push({ color: grid[row][c] ?? -1, r: row, c });
      }
    } else {
      for (let r = 0; r < GRID_SIZE; r++) {
        line.push({ color: grid[r][col] ?? -1, r, c: col });
      }
    }

    const targetIndex = lineIsRow ? col : row;
    let start = targetIndex;
    let end = targetIndex;

    while (start > 0 && line[start - 1].color !== -1) start--;
    while (end < GRID_SIZE - 1 && line[end + 1].color !== -1) end++;

    const segment = line.slice(start, end + 1);
    if (segment.length < minLength) return { length: 0, segment: null };

    // Find the longest palindrome within the segment that includes the placed tile
    const targetPosInSegment = targetIndex - start;
    let bestLength = 0;
    let bestSegment: ScoredTile[] | null = null;

    for (let s = 0; s <= targetPosInSegment; s++) {
      for (let e = targetPosInSegment; e < segment.length; e++) {
        const len = e - s + 1;
        if (len < minLength || !isOdd(len) || len <= bestLength) continue;
        const sub = segment.slice(s, e + 1);
        const colors = sub.map(c => c.color);
        const isPal = colors.join(',') === [...colors].reverse().join(',');
        if (isPal) {
          bestLength = len;
          bestSegment = sub;
        }
      }
    }

    return { length: bestLength, segment: bestSegment };
  };

  const checkRightAngle = (): { length: number; segment: ScoredTile[] | null } => {
    const pairs = [
      { a: { dr: -1, dc: 0 }, b: { dr: 0, dc: -1 } },
      { a: { dr: -1, dc: 0 }, b: { dr: 0, dc: 1 } },
      { a: { dr: 1, dc: 0 }, b: { dr: 0, dc: -1 } },
      { a: { dr: 1, dc: 0 }, b: { dr: 0, dc: 1 } },
    ] as const;

    let bestLen = 0;
    let bestSegment: ScoredTile[] | null = null;

    const tryCorner = (cornerRow: number, cornerCol: number) => {
      const cornerColor = grid[cornerRow][cornerCol];
      if (cornerColor == null) return;

      for (const pair of pairs) {
        let d = 1;
        let lastValid = 0;
        while (true) {
          const ar = cornerRow + pair.a.dr * d;
          const ac = cornerCol + pair.a.dc * d;
          const br = cornerRow + pair.b.dr * d;
          const bc = cornerCol + pair.b.dc * d;
          if (!isInside(ar, ac) || !isInside(br, bc)) break;
          const aColor = grid[ar][ac];
          const bColor = grid[br][bc];
          if (aColor == null || bColor == null) break;
          if (aColor !== bColor) break;
          lastValid = d;
          d++;
        }

        const length = lastValid > 0 ? lastValid * 2 + 1 : 0;
        if (length < minLength || !isOdd(length)) continue;

        let includesPlaced = cornerRow === row && cornerCol === col;
        if (!includesPlaced) {
          for (let dist = 1; dist <= lastValid; dist++) {
            const aR = cornerRow + pair.a.dr * dist;
            const aC = cornerCol + pair.a.dc * dist;
            const bR = cornerRow + pair.b.dr * dist;
            const bC = cornerCol + pair.b.dc * dist;
            if ((aR === row && aC === col) || (bR === row && bC === col)) {
              includesPlaced = true;
              break;
            }
          }
        }
        if (!includesPlaced || length <= bestLen) continue;

        const tiles: ScoredTile[] = [];
        for (let dist = lastValid; dist >= 1; dist--) {
          const rA = cornerRow + pair.a.dr * dist;
          const cA = cornerCol + pair.a.dc * dist;
          tiles.push({ color: grid[rA][cA] as number, r: rA, c: cA });
        }
        tiles.push({ color: cornerColor, r: cornerRow, c: cornerCol });
        for (let dist = 1; dist <= lastValid; dist++) {
          const rB = cornerRow + pair.b.dr * dist;
          const cB = cornerCol + pair.b.dc * dist;
          tiles.push({ color: grid[rB][cB] as number, r: rB, c: cB });
        }
        bestLen = length;
        bestSegment = tiles;
      }
    };

    for (let cornerCol = 0; cornerCol < GRID_SIZE; cornerCol++) {
      tryCorner(row, cornerCol);
    }
    for (let cornerRow = 0; cornerRow < GRID_SIZE; cornerRow++) {
      if (cornerRow === row) continue;
      tryCorner(cornerRow, col);
    }

    return { length: bestLen, segment: bestSegment };
  };

  const scoreFor = (length: number, segment: ScoredTile[] | null) => {
    if (!segment || length < minLength) return { score: 0, hasBulldog: false };
    const hasBulldog = segment.some((b) =>
      bulldogPositions.some((bp) => bp.row === b.r && bp.col === b.c)
    );
    return { score: length + (hasBulldog ? BULLDOG_BONUS : 0), hasBulldog };
  };

  const rowResult = checkLine(true);
  const colResult = checkLine(false);
  const rightAngleResult = checkRightAngle();

  const candidates = [
    { kind: 'row' as const, length: rowResult.length, segment: rowResult.segment },
    { kind: 'col' as const, length: colResult.length, segment: colResult.segment },
    { kind: 'rightAngle' as const, length: rightAngleResult.length, segment: rightAngleResult.segment },
  ]
    .map((candidate) => {
      const score = scoreFor(candidate.length, candidate.segment);
      return { ...candidate, score: score.score, hasBulldog: score.hasBulldog };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => (b.length !== a.length ? b.length - a.length : b.score - a.score));

  const best = candidates[0];
  if (!best) return { score: 0 };

  return {
    score: best.score,
    segmentLength: best.length,
    segment: best.segment ?? undefined,
    kind: best.kind,
    hasBulldog: best.hasBulldog,
  };
}

/**
 * Apply a move: validate, update grid and inventory, compute score delta.
 * Returns { success, newState, scoreDelta }.
 */
export function applyMove(
  state: GameState,
  row: number,
  col: number,
  colorIndex: number,
  minLength: number = MIN_PALINDROME_LENGTH
): {
  success: boolean;
  newState?: GameState;
  scoreDelta?: number;
} {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return { success: false };
  }
  if (state.grid[row][col] !== null) {
    return { success: false };
  }
  if (
    colorIndex < 0 ||
    colorIndex >= NUM_COLORS ||
    state.blockCounts[colorIndex] <= 0
  ) {
    return { success: false };
  }

  const newGrid = state.grid.map((r) => [...r]);
  newGrid[row][col] = colorIndex;

  const result = checkPalindromes(
    newGrid,
    row,
    col,
    state.bulldogPositions,
    minLength
  );

  const newBlockCounts = [...state.blockCounts];
  newBlockCounts[colorIndex] = Math.max(0, newBlockCounts[colorIndex] - 1);

  const newState: GameState = {
    grid: newGrid,
    blockCounts: newBlockCounts,
    score: state.score + result.score,
    bulldogPositions: state.bulldogPositions,
    moveCount: state.moveCount + 1,
  };

  return {
    success: true,
    newState,
    scoreDelta: result.score,
  };
}

/**
 * Find first cell + color that would score (for hints).
 */
export function findScoringMove(
  state: GameState,
  minLength: number = MIN_PALINDROME_LENGTH
): HintMove | null {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (state.grid[r][c] !== null) continue;
      for (let colorIdx = 0; colorIdx < NUM_COLORS; colorIdx++) {
        if (state.blockCounts[colorIdx] <= 0) continue;
        const tempGrid = state.grid.map((rowArr) => [...rowArr]);
        tempGrid[r][c] = colorIdx;
        const result = checkPalindromes(
          tempGrid,
          r,
          c,
          state.bulldogPositions,
          minLength
        );
        if (result.score > 0) {
          return { row: r, col: c, colorIndex: colorIdx };
        }
      }
    }
  }
  return null;
}

/**
 * Whether the player has any blocks left (game can continue with time limit).
 */
export function hasBlocksLeft(state: GameState): boolean {
  return state.blockCounts.some((c) => c > 0);
}

/**
 * Whether there is at least one empty cell (for "board full" check).
 */
export function hasEmptyCell(state: GameState): boolean {
  return state.grid.some((row) => row.some((cell) => cell === null));
}

/**
 * Check if a move would be valid (cell empty, color in stock).
 */
export function canPlace(
  state: GameState,
  row: number,
  col: number,
  colorIndex: number
): boolean {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  if (state.grid[row][col] !== null) return false;
  if (
    colorIndex < 0 ||
    colorIndex >= NUM_COLORS ||
    state.blockCounts[colorIndex] <= 0
  )
    return false;
  return true;
}
