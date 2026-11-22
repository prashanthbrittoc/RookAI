import fs from 'fs';
import { connectDb, disconnectDb } from './db.mjs';
import { GameAnalysis } from './model.mjs';
import { mongoStore } from './store-mongo.mjs';
import { createEngine } from './create-engine.mjs';
import { analyzeGame } from './analyze-game.mjs';
import { explainGame } from './explain-game.mjs';
import { getOrCreateAnalysis } from './analysis-service.mjs';

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
};

console.time('total');
const r = await getOrCreateAnalysis({ pgn, color: COLOR, level: LEVEL || 'beginner' }, deps);
console.timeEnd('total');

console.log(r.cached ? 'CACHE HIT' : 'CACHE MISS');
console.log('explanations:', r.analysis.items.length, '| failures:', r.failures.length);
console.log('tokens:', r.analysis.usage, '| cost: $' + r.analysis.costUsd);

engine?.quit();
await disconnectDb();