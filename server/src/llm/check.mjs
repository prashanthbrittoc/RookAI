// Find move-like tokens (with a piece letter, a capture, or castling) in the text
const MOVE_RE = /\b(?:O-O(?:-O)?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8])[+#]?/g;

const strip = (s) => s.replace(/[+#]/g, '');

export function findUnknownMoves(text, facts) {
  const allowed = new Set([facts.played, facts.best, facts.opponentReply].filter(Boolean).map(strip));
  const mentioned = (text.match(MOVE_RE) || []).map(strip);
  return [...new Set(mentioned)].filter((mv) => !allowed.has(mv));
}