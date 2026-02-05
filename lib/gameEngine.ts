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

/** Fixed positions for initial 3 pre-placed colors (same on both platforms) */
const INITIAL_POSITIONS: { row: number; col: number }[] = [
  { row: 6, col: 5 },
  { row: 5, col: 4 },
  { row: 5, col: 5 },
];

export type Grid = (number | null)[][];

export interface GameState {
  grid: Grid;
  blockCounts: number[];
  score: number;
  bulldogPositions: { row: number; col: number }[];
  moveCount: number;
}

export interface ScoringResult {
  score: number;
  /** For UI feedback: segment length that scored (e.g. 3 = GOOD, 4 = GREAT, ...) */
  segmentLength?: number;
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

/**
 * Create initial game state from a seed (deterministic for multiplayer).
 */
export function createInitialState(seed: string): GameState {
  const rng = createSeededRandom(seed);
  const blocked = getBlockedPositionsForBulldogs();
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

  const initialColors = INITIAL_POSITIONS.map(() =>
    Math.floor(rng() * NUM_COLORS)
  );
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  INITIAL_POSITIONS.forEach((pos, idx) => {
    grid[pos.row][pos.col] = initialColors[idx];
  });

  const blockCounts = [...DEFAULT_BLOCK_COUNTS];
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
  let scoreFound = 0;
  let maxSegmentLength = 0;

  const checkLine = (lineIsRow: boolean) => {
    const line: { color: number; r: number; c: number }[] = [];
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
    if (segment.length >= minLength) {
      const colorsArr = segment.map((s) => s.color);
      const isPal =
        colorsArr.join(',') === [...colorsArr].reverse().join(',');

      if (isPal) {
        let segmentScore = segment.length;
        const hasBulldog = segment.some((b) =>
          bulldogPositions.some((bp) => bp.row === b.r && bp.col === b.c)
        );
        if (hasBulldog) segmentScore += BULLDOG_BONUS;
        scoreFound += segmentScore;
        if (segment.length > maxSegmentLength)
          maxSegmentLength = segment.length;
      }
    }
  };

  checkLine(true);
  checkLine(false);

  return {
    score: scoreFound,
    segmentLength: maxSegmentLength > 0 ? maxSegmentLength : undefined,
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
