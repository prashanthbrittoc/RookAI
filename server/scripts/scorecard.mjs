import fs from 'fs';
import { explainMistake, PROMPT_VERSION } from '../src/llm/explain.mjs';
import { findUnknownMoves } from '../src/llm/check.mjs';

const BANNED = /centipawn|evaluation|stockfish|\bengine\b|[+-]?\d+\.\d+/i;

function checks(r) {
  const all = `${r.title} ${r.explanation} ${r.tip}`;
  const sentences = r.explanation.split(/[.!?]+/).filter((s) => s.trim()).length;
  return {
    unknownMoves: findUnknownMoves(all, r.facts).length,
    banned: BANNED.test(all),
    tooLong: sentences > 3 || r.explanation.split(/\s+/).length > 70,
  };
}

const fixtures = JSON.parse(fs.readFileSync('out/fixtures.json', 'utf8'));
const LEVEL = process.argv[2] || 'beginner';
const rows = [];
const themeCount = {};

for (const [i, m] of fixtures.entries()) {
  const r = await explainMistake(m, { level: LEVEL });
  if (r.skipped) { rows.push({ i, theme: '-', note: 'skipped' }); continue; }
  themeCount[r.facts.theme] = (themeCount[r.facts.theme] || 0) + 1;
  const c = checks(r);
  rows.push({
    i, theme: r.facts.theme, attempts: r.attempts,
    unknown: c.unknownMoves, banned: c.banned, tooLong: c.tooLong,
    tokens: r.usage.input_tokens + r.usage.output_tokens,
  });
  fs.appendFileSync(
    `out/scorecard-${PROMPT_VERSION}.jsonl`,
    JSON.stringify({ i, level: LEVEL, ...r }) + '\n'
  );
}

console.table(rows);
console.log('Themes:', themeCount);
const bad = rows.filter((r) => r.unknown || r.banned || r.tooLong || r.attempts > 1);
console.log(`Prompt ${PROMPT_VERSION}: ${rows.length - bad.length}/${rows.length} clean`);