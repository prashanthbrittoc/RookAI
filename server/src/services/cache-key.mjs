import crypto from 'crypto';
import { Chess } from 'chess.js';

// Bump when thresholds, filters or engine settings change, so old results stop matching
export const ANALYSIS_VERSION = 'a1';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Hash of the moves only (headers and clock comments are ignored)
export function gameHash(pgn) {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error('Invalid PGN');
  }
  const moves = chess.history();
  if (moves.length === 0) throw new Error('Invalid PGN');
  return sha256(moves.join(' '));
}

export function cacheKey({ gameHash, color, depth, level, model, promptVersion }) {
  // fixed order, so the same inputs always produce the same key
  return sha256([gameHash, color, depth, level, model, promptVersion, ANALYSIS_VERSION].join('|'));
}