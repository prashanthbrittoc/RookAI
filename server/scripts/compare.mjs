import fs from 'fs';
import { explainMistake } from '../src/llm/explain.mjs';
import { findUnknownMoves } from '../src/llm/check.mjs';
import { costUsd } from '../src/llm/pricing.mjs';

const fixtures = JSON.parse(fs.readFileSync('out/fixtures.json', 'utf8'));
const PICK = [0, 3, 5, 8, 11, 14]; // replace with your 6 hand-picked indexes
const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'];


for (const i of PICK) {
  const m = fixtures[i];
  console.log(`\n=== #${i} ${m.moveNumber}. ${m.played} (${m.label}) ===`);
  for (const model of MODELS) {
    const r = await explainMistake(m, { model });
    if (r.skipped) {
      console.log(`Skipped: ${r.reason}`);
      continue
    }
    const cost = costUsd(model,r.usage);
    const unknown = findUnknownMoves(`${r.title} ${r.explanation} ${r.tip}`, r.facts);
    console.log(`\n[${model}] attempts=${r.attempts} tokens=${r.usage.input_tokens}/${r.usage.output_tokens} cost=$${cost.toFixed(5)}`);
    console.log(r.title);
    console.log(r.explanation);
    console.log('Tip:', r.tip);
    if (unknown.length) console.log('⚠ unknown moves mentioned:', unknown);
  }
}