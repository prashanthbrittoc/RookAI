import { explainMistake, PROMPT_VERSION, DEFAULT_MODEL } from './explain.mjs';
import { mapLimit } from './concurrency.mjs';
import { classifyError } from './errors.mjs';
import { costUsd } from './pricing.mjs';

export const MAX_EXPLANATIONS = 5;
export const CONCURRENCY = 3;

export async function explainGame(mistakes, {
  level = 'beginner', model = DEFAULT_MODEL, client,
  concurrency = CONCURRENCY, explain = explainMistake,
} = {}) {
  const chosen = mistakes.slice(0, MAX_EXPLANATIONS); // hard cap on API spend per game
  const results = await mapLimit(chosen, concurrency, (m) => explain(m, { level, model, client }));

  const items = [];
  const failures = [];
  const usage = { input_tokens: 0, output_tokens: 0 };

  results.forEach((r, i) => {
    const m = chosen[i];
    if (!r.ok) {
      // failed attempts can still have cost tokens
      usage.input_tokens += r.error.usage?.input_tokens ?? 0;
      usage.output_tokens += r.error.usage?.output_tokens ?? 0;
      failures.push({ ply: m.ply, ...classifyError(r.error), message: r.error.message });
      return;
    }
    const v = r.value;
    if (v.skipped) return;
    usage.input_tokens += v.usage.input_tokens;
    usage.output_tokens += v.usage.output_tokens;
    items.push({
      ply: m.ply, moveNumber: m.moveNumber, played: m.played, label: m.label,
      theme: v.facts.theme, title: v.title, explanation: v.explanation, tip: v.tip,
      attempts: v.attempts,
    });
  });

  return { items, failures, usage, costUsd: costUsd(model, usage), model, level, promptVersion: PROMPT_VERSION };
}

export function summarizeGame(items) {
  const themeCounts = {};
  for (const it of items) themeCounts[it.theme] = (themeCounts[it.theme] || 0) + 1;
  const top = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
  return { mistakeCount: items.length, themeCounts, mainTheme: top ? top[0] : null };
}