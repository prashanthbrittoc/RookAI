import { explainMistake } from './explain.mjs';

const MISTAKE = {
  ply: 3, moveNumber: 2, color: 'w', played: 'Nf3', playedUci: 'g1f3',
  bestUci: 'd2d4', replyUci: 'b8c6', loss: 150, label: 'mistake', beforeCp: 30, afterCp: -120,
  fenBefore: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  fenAfter: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
};
const GOOD = '{"title":"A quieter move","explanation":"Nf3 is playable but d4 fights for the center. Try that next time.","tip":"Fight for the center early."}';
const reply = (text) => ({ 
    content: [{ type: 'text', text }], 
    usage: { input_tokens: 10, output_tokens: 5 } 
});

const fakeClient = (...texts) => {
  let i = 0;
  return { messages: { create: async () => reply(texts[i++]) } };
};

test('retries once on broken JSON and sums token usage', async () => {
  const r = await explainMistake(MISTAKE, { client: fakeClient('not json', GOOD) });
  expect(r.attempts).toBe(2);
  expect(r.usage).toEqual({ input_tokens: 20, output_tokens: 10 });
});

test('throws BadOutputError (with usage) after two bad replies', async () => {
  await expect(explainMistake(MISTAKE, { client: fakeClient('nope', 'still nope') }))
    .rejects.toMatchObject({ name: 'BadOutputError', usage: { input_tokens: 20, output_tokens: 10 } });
});

test('skips without calling the API when played equals best', async () => {
  const client = { messages: { create: async () => { throw new Error('should not be called'); } } };
  const r = await explainMistake({ ...MISTAKE, bestUci: MISTAKE.playedUci }, { client });
  expect(r.skipped).toBe(true);
});