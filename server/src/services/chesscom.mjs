import { ChessComError } from './chesscom-errors.mjs';
import 'dotenv/config'

const BASE = 'https://api.chess.com/pub';
const USERNAME_RE = /^[a-z0-9_-]{3,25}$/;

export function normalizeUsername(raw) {
  const u = String(raw ?? '').trim().toLowerCase();
  if (!USERNAME_RE.test(u)) throw new ChessComError('INVALID_USERNAME', 'Invalid Chess.com username');
  return u;
}

const LOSS_CODES = new Set(['checkmated', 'timeout', 'resigned', 'abandoned', 'lose', 'kingofthehill', 'threecheck']);

export function outcomeOf(resultCode) {
  if (resultCode === 'win') return 'win';
  return LOSS_CODES.has(resultCode) ? 'loss' : 'draw';
}

// Returns null for games we can't or won't analyze
export function normalizeGame(g, username) {
  const me = username.toLowerCase();
  if (g.rules !== 'chess' || !g.pgn || !g.url) return null;

  const isWhite = g.white?.username?.toLowerCase() === me;
  const isBlack = g.black?.username?.toLowerCase() === me;
  if (!isWhite && !isBlack) return null;

  const mine = isWhite ? g.white : g.black;
  const opp = isWhite ? g.black : g.white;
  const d = new Date(g.end_time * 1000);

  return {
    id: g.url.split('/').pop(),
    archive: `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
    color: isWhite ? 'w' : 'b',
    opponent: opp.username,
    opponentRating: opp.rating,
    myRating: mine.rating,
    result: outcomeOf(mine.result),
    endReason: mine.result === 'win' ? opp.result : mine.result,
    timeClass: g.time_class,
    timeControl: g.time_control,
    rated: Boolean(g.rated),
    endedAt: d.toISOString(),
    url: g.url,
    pgn: g.pgn,
  };
}

export function createChessComClient({
  fetch: fetchFn = globalThis.fetch,
  contact = process.env.CHESSCOM_CONTACT || 'unset',
  timeoutMs = 8000,
  ttlMs = 60_000,
} = {}) {
  const userAgent = `RookAI/0.1 (contact: ${contact})`;
  const cache = new Map(); // url -> { at, data }

  async function getJson(url, notFoundCode = 'USER_NOT_FOUND') {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data;

    let res;
    try {
      res = await fetchFn(url, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') throw new ChessComError('TIMEOUT', 'Chess.com took too long to respond');
      throw new ChessComError('UPSTREAM', 'Could not reach Chess.com');
    }
    if (res.status === 404) throw new ChessComError(notFoundCode, notFoundCode === 'USER_NOT_FOUND' ? 'Chess.com user not found' : 'Game not found');
    if (res.status === 429) throw new ChessComError('RATE_LIMITED', 'Chess.com rate limit hit, try again shortly');
    if (!res.ok) throw new ChessComError('UPSTREAM', `Chess.com returned ${res.status}`);

    const data = await res.json();
    cache.set(url, { at: Date.now(), data });
    return data;
  }

  // methods are added in Block 4
    async function getRecentGames(rawUsername, { limit = 20, maxMonths = 3 } = {}) {
    const username = normalizeUsername(rawUsername);
    const { archives = [] } = await getJson(`${BASE}/player/${username}/games/archives`);

    const games = [];
    // Newest month first. One request at a time on purpose: Chess.com asks clients not to parallelize.
    for (const url of archives.slice(-maxMonths).reverse()) {
      const month = await getJson(url, 'USER_NOT_FOUND');
      const normalized = (month.games ?? [])
        .map((g) => normalizeGame(g, username))
        .filter(Boolean)
        .reverse(); // oldest-first -> newest-first
      games.push(...normalized);
      if (games.length >= limit) break;
    }
    return games.slice(0, limit);
  }

  async function getGameById(rawUsername, gameId, archive) {
    const username = normalizeUsername(rawUsername);
    if (!/^\d{4}\/\d{2}$/.test(archive ?? '') || !/^\d+$/.test(String(gameId))) {
      throw new ChessComError('GAME_NOT_FOUND', 'Game not found');
    }
    const month = await getJson(`${BASE}/player/${username}/games/${archive}`, 'GAME_NOT_FOUND');
    const raw = (month.games ?? []).find((g) => g.url?.split('/').pop() === String(gameId));
    const game = raw && normalizeGame(raw, username);
    if (!game) throw new ChessComError('GAME_NOT_FOUND', 'Game not found');
    return game;
  }

  return { getRecentGames, getGameById };
}