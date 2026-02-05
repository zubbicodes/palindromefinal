/**
 * Deterministic PRNG from a string seed (Mulberry32).
 * Used for multiplayer so both players get the same board from the same seed.
 */

/**
 * Returns a function that yields values in [0, 1) deterministically from the seed.
 */
export function createSeededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h = h >>> 0;
  }
  return function next(): number {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h = h >>> 0;
    return (h >>> 0) / 4294967296;
  };
}
