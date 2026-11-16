export function levelBand(rating) {
  if (rating == null || rating < 700) return 'beginner';
  if (rating < 1000) return 'improving';
  return 'intermediate';
}

export const LEVEL_GUIDE = {
  beginner: 'The player is a beginner (under 700). Use very short sentences and everyday words. If you mention a chess idea like "fork" or "pin", explain it in a few words. Write the move in words too, for example "knight to f3 (Nf3)".',
  improving: 'The player is improving (700-1000). Clear, simple language. You may use basic terms like "fork" or "developing" without explaining them.',
  intermediate: 'The player is intermediate (1000+). Be concise. Basic tactical terms are fine. Skip obvious advice.',
};