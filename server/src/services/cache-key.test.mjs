import { gameHash, cacheKey } from './cache-key.mjs';

const A = '1. e4 e5 2. Nf3 Nc6';
const B = '[Event "Live Chess"]\n[White "someone"]\n\n1. e4 {[%clk 0:09:58]} e5 {[%clk 0:09:57]} 2. Nf3 Nc6';
const base = { gameHash: gameHash(A), color: 'w', depth: 10, level: 'beginner', model: 'claude-haiku-5-5', promptVersion: 'v2' };

test('headers and clock comments do not change the game hash', () => {
  expect(gameHash(A)).toBe(gameHash(B));
});
test('different moves give a different hash', () => {
  expect(gameHash(A)).not.toBe(gameHash('1. d4 d5'));
});
test('same inputs give the same key', () => {
  expect(cacheKey(base)).toBe(cacheKey({ ...base }));
});
test.each([['color', 'b'], ['depth', 12], ['level', 'improving'], ['model', 'claude-sonnet-5-5'], ['promptVersion', 'v3']])(
  'changing %s changes the key',
  (field, value) => {
    expect(cacheKey({ ...base, [field]: value })).not.toBe(cacheKey(base));
  }
);
test('invalid or empty PGN throws', () => {
  expect(() => gameHash('garbage')).toThrow('Invalid PGN');
  expect(() => gameHash('')).toThrow('Invalid PGN');
});