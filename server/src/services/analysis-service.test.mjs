import { getOrCreateAnalysis } from './analysis-service.mjs';

const PGN = '1. e4 e5 2. Nf3 Nc6';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeDeps({ failures = [] } = {}) {
  const db = new Map();
  const calls = { analyze: 0, explain: 0 };
  return {
    db, calls,
    store: {
      find: async (k) => db.get(k) ?? null,
      save: async (doc) => {
        if (db.has(doc.cacheKey)) return { saved: false, duplicate: true };
        db.set(doc.cacheKey, doc);
        return { saved: true };
      },
    },
    analyze: async () => {
      calls.analyze++;
      await sleep(5);
      return {
        moves: [{ ply: 1, moveNumber: 1, color: 'w', played: 'e4', beforeCp: 20, afterCp: 20, loss: 0 }],
        topMistakes: [{ ply: 3, fenBefore: 'x', playedUci: 'g1f3', bestUci: 'd2d4', loss: 150, label: 'mistake' }],
      };
    },
    explain: async () => {
      calls.explain++;
      return { items: [{ ply: 3, title: 't', explanation: 'e', tip: 'p' }], failures, usage: { input_tokens: 100, output_tokens: 50 }, costUsd: 0.001 };
    },
  };
}

test('second identical request is a cache hit and does no work', async () => {
  const d = makeDeps();
  const first = await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  const second = await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  expect(first.cached).toBe(false);
  expect(second.cached).toBe(true);
  expect(d.calls).toEqual({ analyze: 1, explain: 1 });
});

test('a different level is a different cache entry', async () => {
  const d = makeDeps();
  await getOrCreateAnalysis({ pgn: PGN, color: 'w', level: 'beginner' }, d);
  await getOrCreateAnalysis({ pgn: PGN, color: 'w', level: 'improving' }, d);
  expect(d.calls.analyze).toBe(2);
  expect(d.db.size).toBe(2);
});

test('incomplete results are not cached', async () => {
  const d = makeDeps({ failures: [{ ply: 3, kind: 'rate-limit', retryable: true }] });
  const r = await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  expect(r.failures).toHaveLength(1);
  expect(d.db.size).toBe(0);
  expect(d.calls.analyze).toBe(2);
});

test('two simultaneous identical requests share one run', async () => {
  const d = makeDeps();
  const [a, b] = await Promise.all([
    getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d),
    getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d),
  ]);
  expect(d.calls.analyze).toBe(1);
  expect(a.analysis.cacheKey).toBe(b.analysis.cacheKey);
});

test('a broken cache does not break the analysis', async () => {
  const d = makeDeps();
  d.store.find = async () => { throw new Error('db down'); };
  d.store.save = async () => { throw new Error('db down'); };
  const r = await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  expect(r.cached).toBe(false);
  expect(r.analysis.items.length).toBeGreaterThan(0);
});

test('records a miss event with cost, then a hit event with savings', async () => {
  const d = makeDeps();
  const events = [];
  d.recordEvent = async (e) => events.push(e);

  await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);

  expect(events).toHaveLength(2);
  expect(events[0]).toMatchObject({ cached: false, costUsd: 0.001, inputTokens: 100, outputTokens: 50 });
  expect(events[1]).toMatchObject({ cached: true, savedUsd: 0.001, costUsd: 0 });
});

test('a failing recordEvent does not break the request', async () => {
  const d = makeDeps();
  d.recordEvent = async () => { throw new Error('db down'); };
  const r = await getOrCreateAnalysis({ pgn: PGN, color: 'w' }, d);
  expect(r.analysis.items.length).toBeGreaterThan(0);
});