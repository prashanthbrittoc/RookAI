import { gameHash, cacheKey, ANALYSIS_VERSION } from './cache-key.mjs';
import { PROMPT_VERSION, DEFAULT_MODEL } from '../llm/explain.mjs';
import { LEVEL_GUIDE } from '../llm/level.mjs';

const colors = ['w','b']
const max_pgn_chars = 20_000

export const DEFAULT_DEPTH = 10;
const inFlight = new Map(); // requests running right now, by cache key

async function record(deps, evt) {
  try { await deps.recordEvent?.(evt); }
  catch (e) { console.log('usage event failed:', e.message); } // never break a request for bookkeeping
}

export async function getOrCreateAnalysis(
  { pgn, color, level = 'beginner', depth = DEFAULT_DEPTH, model = DEFAULT_MODEL },
  deps
) {

  if (typeof pgn !== 'string' || !pgn.trim()) throw new Error('Invalid PGN');
  if (pgn.length > max_pgn_chars) throw new Error('PGN too large');
  if (!colors.includes(color)) throw new Error('color must be "w" or "b"');
  if (!(level in LEVEL_GUIDE)) throw new Error(`unknown level: ${level}`);
  
  const { store, analyze, explain} = deps
  const gh = gameHash(pgn);
  const key = cacheKey({ gameHash: gh, color, depth, level, model, promptVersion: PROMPT_VERSION });

  // An identical request is already running: wait for it instead of paying twice
  if (inFlight.has(key)) return inFlight.get(key);

  const job = (async () => {
    
    const started = Date.now()

    // The cache is an optimization: if it is down, carry on as a miss
    try {
      const hit = await store.find(key);
      if (hit) {
        await record(deps, {
          cacheKey: key, cached: true, model, level, promptVersion: PROMPT_VERSION,
          costUsd: 0,                      
          savedUsd: hit.costUsd ?? 0,
          durationMs: Date.now() - started,
        });
        return { cached: true, analysis: hit, failures: [] };
      };
    } catch (e) {
      console.log('cache lookup failed:', e.message);
    }

    const { moves, topMistakes } = await analyze(pgn, { depth, color });
    const exp = await explain(topMistakes, { level, model });

    await record(deps, {
      cached: false,     
      model,                
      inputTokens: exp.usage.input_tokens,
      outputTokens: exp.usage.output_tokens,
      costUsd: exp.costUsd ?? 0,         // what we actually paid
      durationMs: Date.now() - started,
    });

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
        console.log('cache save failed:', e.message); // the user still gets their result
      }
    }
    return { cached: false, analysis: doc, failures: exp.failures };
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, job);
  return job;
}