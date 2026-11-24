import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { buildFacts } from './facts.mjs';
import { LEVEL_GUIDE } from './level.mjs';
import { BadOutputError } from './errors.mjs';

let _client
const getClient = () => (_client ??= new Anthropic({ maxRetries: 3, timeout: 30_000 }));

const THINKING = {
  'claude-haiku-5-5': { type: 'disabled' },
  'claude-sonnet-5-5': { type: 'between_tools' },
}

const THEME_HINTS = {
  'allowed-mate': 'The move allows the opponent to checkmate. Say clearly that the king is in danger and what to check before moving (can the opponent give check?).',
  'missed-mate': 'The player had a checkmate available and missed it. Be encouraging and name the mating move.',
  'hung-piece': 'The move leaves a piece to be captured for free or for too little. The tip should be a habit: before moving, ask "what can the opponent capture now?".',
  'missed-capture': 'A good capture was available. Name what could have been won.',
  'opening': 'This is early in the game. Mention a simple opening principle ONLY if it truly matches the better move (for example developing a piece or controlling the center).',
  'general': 'Explain in simple terms why the better move is stronger. Do not force a theme.',
  'blunder': 'This move was a serious mistake that cost a lot, but the verified facts do not show a mate or a lost piece, so do not claim one. Say plainly that this move changed the game, then explain in simple terms what the better move does instead. Stay calm and encouraging, not scary. The tip should be one small habit, such as "before you move, check what your opponent threatens", and not a general principle.'
};

const client = new Anthropic();
export const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';

const buildSystem = (level) => `You are a friendly chess coach for beginners rated 400-1200.
You explain ONE mistake at a time.

Rules:
- Use ONLY the facts provided. Never mention moves, pieces, squares or tactics that are not in the facts.
- Never mention engine numbers, "centipawns" or evaluations. Say things like "you lose a knight" or "you give up a pawn".
- Plain English, short words, no jargon. Be encouraging, never harsh.
- Say what the better move is, but do NOT explain why it is better unless the facts say so. Use phrasing like "a stronger move was Rd3".
- The explanation must not contain the tip. Keep them separate.
- Never use the words "edge", "initiative", "advantage", or "pawns of value". Describe loss only as a piece or pawn you lose, or just say "a small/big loss".
- If the better move is unknown, do not suggest a specific move.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"title": "<5-8 word headline>", "explanation": "<2-3 sentences: what went wrong, then what to try>", "tip": "<one short rule of thumb for next time>"}

${LEVEL_GUIDE[level]}`;

function buildUserMessage(f) {
  const lines = [
    `${f.player} played ${f.moveNumber}. ${f.played} (a ${f.label}).`,
    '',
    'Board before the move:',
    f.board,
    '',
    'Verified facts:',
    `- Better move: ${f.best ?? 'unknown'}${f.bestCaptures ? ` (captures a ${f.bestCaptures})` : ''}${f.bestGivesCheck ? ' (gives check)' : ''}.`,
    `- After the move played, the opponent's strongest reply is ${f.opponentReply ?? 'unknown'}${f.replyCaptures ? `, capturing a ${f.replyCaptures}` : ''}${f.replyGivesCheck ? ', giving check' : ''}${f.replyIsMate ? ', which is checkmate' : ''}.`,
    `- Approximate cost of the mistake: ${f.pawnsLost} pawn(s) of value.`,
    `- Type of mistake: ${f.theme}. ${THEME_HINTS[f.theme]}`
  ];
  return lines.join('\n');
}

function parseExplanation(text) {
   if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response: no text block returned');
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found');
  const data = JSON.parse(text.slice(start, end + 1));

  for (const key of ['title', 'explanation', 'tip']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }

  if (data.explanation.length > 600) {
    throw new Error(`explanation too long (${parsed.explanation.length} chars)`);
  }
  
  return { title: data.title.trim(), explanation: data.explanation.trim(), tip: data.tip.trim() };
}

export async function explainMistake(m, { model = DEFAULT_MODEL, level = 'beginner', client = getClient() } = {}) {
  const facts = buildFacts(m);

  if (facts.best && facts.best === facts.played) {
    return { skipped: true, reason: 'played move equals engine best move', facts };
  }

  const usage = { input_tokens: 0, output_tokens: 0 };
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await client.messages.create({
      model,
      max_tokens: 400,
      ...(THINKING[model] && { thinking: THINKING[model] }),
      system: buildSystem(level),
      messages: [{ role: 'user', content: buildUserMessage(facts) }],
    });
    usage.input_tokens += res.usage.input_tokens;
    usage.output_tokens += res.usage.output_tokens;

    const text = res.content.find((b) => b.type === 'text')?.text ?? ''

    try {
      return { ...parseExplanation(text), facts, level, usage, model, attempts: attempt };
    } catch (e) {
      lastError = e;
    }
  }
  throw new BadOutputError(`Could not get valid JSON after 2 attempts: ${lastError.message}`, usage);
}

export const PROMPT_VERSION = 'v2'