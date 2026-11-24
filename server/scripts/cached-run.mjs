import fs from 'fs';
import { connectDb, disconnectDb } from '../src/db/connect.mjs';
import { GameAnalysis } from '../src/db/models/GameAnalysis.mjs';
import { mongoStore } from '../src/db/analysis-store.mjs';
import { createEngine } from '../src/engine/create-engine.mjs';
import { analyzeGame } from '../src/chess/analyze-game.mjs';
import { explainGame } from '../src/llm/explain-game.mjs';
import { getOrCreateAnalysis } from '../src/services/analysis-service.mjs';
import { requireEnv } from '../src/config/env.mjs';
import { recordUsageEvent } from '../src/db/analysis-store.mjs';

requireEnv('MONGODB_URI','ANTHROPIC_API_KEY')

const [PGN_FILE, COLOR, LEVEL] = process.argv.slice(2);
const pgn = fs.readFileSync(PGN_FILE, 'utf8');

await connectDb();
await GameAnalysis.init();

let engine; // created only if we actually need it
const deps = {
  store: mongoStore,
  analyze: async (p, opts) => {
    engine ??= await createEngine();
    return analyzeGame(engine, p, opts);
  },
  explain: explainGame,
  recordEvent: recordUsageEvent,
};

console.time('total');
const r = await getOrCreateAnalysis({ pgn, color: COLOR, level: LEVEL || 'beginner' }, deps);
console.timeEnd('total');

console.log(r.cached ? 'CACHE HIT' : 'CACHE MISS');
console.log('explanations:', r.analysis.items.length, '| failures:', r.failures.length);
console.log('tokens:', r.analysis.usage, '| cost: $' + r.analysis.costUsd);

engine?.quit();
await disconnectDb();