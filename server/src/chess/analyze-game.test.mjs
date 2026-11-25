import { analyzeGame } from './analyze-game.mjs';

const PGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'; // 6 plies -> 7 evaluations

test('flat evaluations produce no mistakes', async () => {
  const fake = { evaluate: async () => ({ bestMove: 'e2e4', score: { type: 'cp', value: 20 } }) };
  const { moves, topMistakes } = await analyzeGame(fake, PGN, { depth: 1, color: 'w' });
  expect(moves).toHaveLength(6);
  expect(topMistakes).toEqual([]);
});

test('detects a blunder on White\'s 2nd move', async () => {
  const scores = [20, -20, 20, 500, 0, 0, 0]; // side-to-move view, one per position
  let i = 0;
  const fake = {
    evaluate: async () => ({ bestMove: 'e2e4', score: { type: 'cp', value: scores[i++] } }),
  };
  const { topMistakes } = await analyzeGame(fake, PGN, { depth: 1, color: 'w' });
  expect(topMistakes).toHaveLength(1);
  expect(topMistakes[0].ply).toBe(3);
  expect(topMistakes[0].label).toBe('blunder');
});

const PGN_B = '1. e4 e5';
const engineWith = (scores) => {
  let i = 0;
  return { evaluate: async () => ({ bestMove: 'e2e4', score: { type: 'cp', value: scores[i++] } }) };
};

test('a balanced game has zero loss for both colors', async () => {
  // start +20 (white to move), after e4 -20 (black to move), after e5 +20 (white to move)
  const { moves } = await analyzeGame(engineWith([20, -20, 20]), PGN_B, { depth: 1 });
  expect(moves.map((m) => m.loss)).toEqual([0, 0]);
});

test("Black's blunder is measured from Black's point of view", async () => {
  // after e5 White is suddenly +600, so Black's move lost 580
  const { moves, topMistakes } = await analyzeGame(engineWith([20, -20, 600]), PGN_B, { depth: 1, color: 'b' });
  expect(moves[0].loss).toBe(0);
  expect(moves[1].loss).toBe(580);
  expect(topMistakes).toHaveLength(1);
  expect(topMistakes[0]).toMatchObject({ ply: 2, label: 'blunder', color: 'b' });
});