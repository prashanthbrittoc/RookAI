import { requireEnv } from '../src/config/env.mjs';
import { createChessComClient } from '../src/services/chesscom.mjs';

const [username, limit] = process.argv.slice(2);
const client = createChessComClient();

try {
  console.time('fetch');
  const games = await client.getRecentGames(username, { limit: Number(limit || 10) });
  console.timeEnd('fetch');
  console.table(games.map(({ id, archive, color, opponent, opponentRating, result, endReason, timeClass, endedAt }) =>
    ({ id, archive, color, opponent, opponentRating, result, endReason, timeClass, endedAt: endedAt.slice(0, 10) })));

  const first = games[0];
  if (first) {
    const one = await client.getGameById(username, first.id, first.archive);
    console.log('by id ok:', one.id, '| pgn chars:', one.pgn.length);
  }
} catch (e) {
  console.error(`${e.code ?? 'ERROR'} (${e.httpStatus ?? '-'}): ${e.message}`);
  process.exitCode = 1;
}