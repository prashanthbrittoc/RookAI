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