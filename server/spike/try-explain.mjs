import fs from 'fs';
import { createEngine } from './create-engine.mjs';
import { analyzeGame } from './analyze-game.mjs';
import { explainGame, summarizeGame } from './explain-game.mjs';

const [PGN_FILE, COLOR, CONC] = process.argv.slice(2);
const engine = await createEngine();
const { topMistakes } = await analyzeGame(engine, fs.readFileSync(PGN_FILE, 'utf8'), { color: COLOR });
engine.quit();

console.time('explain');
const r = await explainGame(topMistakes, { concurrency: Number(CONC || 3) });
console.timeEnd('explain');

console.log(r.items);
console.log('summary:', summarizeGame(r.items));
console.log('failures:', r.failures);
console.log('tokens:', r.usage, 'cost: $' + (r.costUsd ?? 'n/a'));

fs.mkdirSync('out', { recursive: true });
fs.appendFileSync('out/usage.jsonl', JSON.stringify({
  ts: new Date().toISOString(), model: r.model, promptVersion: r.promptVersion,
  tokens: r.usage, costUsd: r.costUsd, explained: r.items.length, failed: r.failures.length,
}) + '\n');