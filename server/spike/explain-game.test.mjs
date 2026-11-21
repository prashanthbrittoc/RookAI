import { explainGame } from './explain-game.mjs';

const mk = (ply) => ({ ply, moveNumber: ply, played: 'e4', label: 'mistake' });
const ok = (m) => ({
  facts: { theme: 'general' }, title: 't', explanation: 'e', tip: 'p', attempts: 1,
  usage: { input_tokens: 100, output_tokens: 50 },
});

test('explains at most 5 mistakes', async () => {
  const explain = async (m) => ok(m);
  const r = await explainGame([1, 2, 3, 4, 5, 6, 7].map(mk), { explain });
  expect(r.items).toHaveLength(5);
  expect(r.usage).toEqual({ input_tokens: 500, output_tokens: 250 });
});

test('a failed item is reported, the rest still return', async () => {
  const explain = async (m) => {
    if (m.ply === 2) throw Object.assign(new Error('slow down'), { status: 429 });
    return ok(m);
  };
  const r = await explainGame([1, 2, 3].map(mk), { explain });
  expect(r.items.map((i) => i.ply)).toEqual([1, 3]);
  expect(r.failures).toEqual([expect.objectContaining({ ply: 2, kind: 'rate-limit', retryable: true })]);
});