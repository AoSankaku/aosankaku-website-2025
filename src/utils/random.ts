// src/utils/random.ts (Deterministic Single Random Value)

/**
 * Non-cryptographic FNV-1a hash function for integers.
 * This is used internally to scramble the monthly seed for better diffusion.
 * @param {number} seed - The input integer seed (e.g., monthly seed).
 * @returns {number} A highly diffused 32-bit integer.
 */
function hashSeed(seed: number): number {
  // FNV-1a constants (32-bit)
  let h = 2166136261; // FNV_offset_basis
  const p = 16777619; // FNV_prime

  // Hash the integer seed bytes
  for (let i = 0; i < 4; i++) {
    h ^= (seed >> (i * 8)) & 0xff;
    h = Math.imul(h, p); // Use Math.imul for guaranteed 32-bit multiplication
  }

  // Ensure it's a positive 32-bit integer
  return h >>> 0;
}

/**
 * Calculates a single, deterministic pseudo-random floating-point number
 * based on the input seed.
 * * If the input 'seed' is the same, the output is guaranteed to be the same.
 * The internal logic uses hashing + the core mulberry32 algorithm steps.
 * * @param {number} seed - The input integer seed (e.g., monthly seed).
 * @returns {number} A single pseudo-random float between 0 (inclusive) and 1 (exclusive).
 */
export function seededRandomValue(seed: number): number {
  // 1. SCRAMBLE THE INPUT SEED FIRST for high diffusion
  let a = hashSeed(seed);

  // 2. Perform ONE iteration of the mulberry32-like calculation (the randomization)
  a |= 0;
  a = Math.imul(a, 0x6D2B79F5) + a | 0; // Optimization of: a = a + 0x6D2B79F5 | 0;

  let t = a ^ a >>> 15;
  t = t + 0x2C632C4A | 0;
  t = t ^ t >>> 12;
  t = t + 0x57B2F6DA | 0;
  t = t ^ t >>> 16;

  // 3. Return the normalized 32-bit integer as a float [0, 1)
  return (t >>> 0) / 4294967296;
}

/**
 * Calculates a unique integer seed based on the current year and month.
 * @returns {number} A seed that changes monthly.
 */
export function getMonthlySeed(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Combine Year and Month Index
  return year * 100 + month;
}