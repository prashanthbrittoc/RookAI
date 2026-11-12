import 'dotenv/config'
import { Anthropic } from '@anthropic-ai/sdk'
import { buildFacts } from './facts.mjs'

const client = new Anthropic()
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5'

const SYSTEM = `You are a friendly chess coach for beginners rated 400-1200.
Explain ONE mistake in 2-3 short sentences of plain English.

Rules:
- Use only the facts provided. Never invent moves, pieces or tactics that are not listed.
- No engine jargon: never say "centipawns" or quote evaluation numbers. Say things like "you lose a pawn" or "you lose a knight's worth".
- Say what went wrong, then what to try instead.
- Be encouraging, never harsh.`

export async function explainMistake(m) 
{
    const f = buildFacts(m)
    
    const userMessage = `${f.player} played ${f.moveNumber}. ${f.played}, which was a ${f.label}.

    Position before the move:
    ${f.board}

    Facts from the chess engine:
    - The better move was ${f.best ?? 'unknown'}.
    - After the move played, the opponent's strongest reply is ${f.opponentReply ?? 'unknown'}.
    - The mistake costs roughly ${f.pawnsLost} pawn(s) of value.

    Explain the mistake to the player.`

    const res = await client.messages.create({
        model: MODEL,
        max_tokens: 300,
        thinking: { type: 'between_tools' },
        system: SYSTEM,
        messages: [{ role: 'user', content: userMessage}]
    })

    return { text: res.content[0].text, usage: res.usage}
}
