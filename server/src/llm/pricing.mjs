// Fill these from Anthropic's pricing page (USD per million tokens)
const PRICE = {
  'claude-haiku-5-5': { in: 0.10, out: 0.50 },
  'claude-sonnet-5-5': { in: 2.00, out: 10.00 },
};

export function costUsd(model, usage) {
  const p = PRICE[model];
  if (!p) return null;
  return (usage.input_tokens * p.in + usage.output_tokens * p.out) / 1e6;
}