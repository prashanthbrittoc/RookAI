import { gameHash, cacheKey, ANALYSIS_VERSION } from './cache-key.mjs';
import { PROMPT_VERSION, DEFAULT_MODEL } from './explain.mjs';

export const DEFAULT_DEPTH = 10;
const inFlight = new Map(); // requests running right now, by cache key

export async function getOrCreateAnalysis(
  { pgn, color, level = 'beginner', depth = DEFAULT_DEPTH, model = DEFAULT_MODEL },
  { store, analyze, explain }
) {
  const gh = gameHash(pgn);
  const key = cacheKey({ gameHash: gh, color, depth, level, model, promptVersion: PROMPT_VERSION });

  // An identical request is already running: wait for it instead of paying twice
  if (inFlight.has(key)) return inFlight.get(key);

  const job = (async () => {
    // The cache is an optimization: if it is down, carry on as a miss
    try {
      const hit = await store.find(key);
      if (hit) return { cached: true, analysis: hit, failures: [] };
    } catch (e) {
      console.error('cache lookup failed:', e.message);
    }

    const { moves, topMistakes } = await analyze(pgn, { depth, color });
    const exp = await explain(topMistakes, { level, model });

    const doc = {
      cacheKey: key, gameHash: gh, color, depth, level, model,
      promptVersion: PROMPT_VERSION, analysisVersion: ANALYSIS_VERSION,
      moves: moves.map(({ ply, moveNumber, color, played, beforeCp, afterCp, loss }) =>
        ({ ply, moveNumber, color, played, beforeCp, afterCp, loss })),
      mistakes: topMistakes.map(({ ply, fenBefore, playedUci, bestUci, loss, label }) =>
        ({ ply, fenBefore, playedUci, bestUci, loss, label })),
      items: exp.items, usage: exp.usage, costUsd: exp.costUsd,
    };

    // Only cache complete results. A partial result would be served as final forever.
    if (exp.failures.length === 0) {
      try {
        await store.save(doc);
      } catch (e) {
        console.error('cache save failed:', e.message); // the user still gets their result
      }
    }
    return { cached: false, analysis: doc, failures: exp.failures };
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, job);
  return job;
}