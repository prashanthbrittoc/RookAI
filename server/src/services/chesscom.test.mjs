import { normalizeGame, outcomeOf, normalizeUsername, createChessComClient } from './chesscom.mjs';
import { ChessComError } from './chesscom-errors.mjs';


const RAW = {
  url: 'https://www.chess.com/game/live/123456', pgn: '1. e4 e5', rules: 'chess',
  time_class: 'rapid', time_control: '600', rated: true, end_time: 1793000000,
  white: { username: 'Prashanth_X', rating: 1450, result: 'win' },
  black: { username: 'rival', rating: 1400, result: 'resigned' },
};

test('maps a win as White', () => {
  const g = normalizeGame(RAW, 'prashanth_x');
  expect(g).toMatchObject({ id: '123456', color: 'w', opponent: 'rival', result: 'win', endReason: 'resigned', myRating: 1450 });
});
test('maps a loss as Black and keeps the reason', () => {
  const raw = { ...RAW, white: { ...RAW.white, username: 'rival', result: 'win' }, black: { ...RAW.black, username: 'prashanth_x', result: 'timeout' } };
  expect(normalizeGame(raw, 'prashanth_x')).toMatchObject({ color: 'b', result: 'loss', endReason: 'timeout' });
});
test.each([['agreed', 'draw'], ['stalemate', 'draw'], ['checkmated', 'loss'], ['win', 'win']])('outcomeOf %s -> %s', (code, out) => {
  expect(outcomeOf(code)).toBe(out);
});
test('skips variants, games without a PGN, and games that are not the player\'s', () => {
  expect(normalizeGame({ ...RAW, rules: 'chess960' }, 'prashanth_x')).toBeNull();
  expect(normalizeGame({ ...RAW, pgn: undefined }, 'prashanth_x')).toBeNull();
  expect(normalizeGame(RAW, 'someone_else')).toBeNull();
});
test('usernames are lowercased and validated', () => {
  expect(normalizeUsername('  Prashanth_X ')).toBe('prashanth_x');
  expect(() => normalizeUsername('a')).toThrow('Invalid Chess.com username');
  expect(() => normalizeUsername('bad name!')).toThrow('Invalid Chess.com username');
  expect(() => normalizeUsername('../etc')).toThrow('Invalid Chess.com username');
});

const resp = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const r = routes[url];
    if (r instanceof Error) throw r;
    return r ?? resp({}, 404);
  };
  fn.calls = calls;
  return fn;
}

const U = 'https://api.chess.com/pub/player/prashanth_x/games';
const game = (id, endTime) => ({ ...RAW, url: `https://www.chess.com/game/live/${id}`, end_time: endTime });
const routes = () => ({
  [`${U}/archives`]: resp({ archives: [`${U}/2026/10`, `${U}/2026/11`] }),
  [`${U}/2026/11`]: resp({ games: [game(1, 1793000000), game(2, 1793100000)] }),
  [`${U}/2026/10`]: resp({ games: [game(3, 1790000000)] }),
});

test('returns newest games first, walking back through months', async () => {
  const c = createChessComClient({ fetch: fakeFetch(routes()) });
  const games = await c.getRecentGames('prashanth_x', { limit: 3 });
  expect(games.map((g) => g.id)).toEqual(['2', '1', '3']);
});

test('stops early once the limit is reached', async () => {
  const f = fakeFetch(routes());
  const c = createChessComClient({ fetch: f });
  await c.getRecentGames('prashanth_x', { limit: 1 });
  expect(f.calls).toHaveLength(2); // archives + newest month only
});

test('unknown user is USER_NOT_FOUND', async () => {
  const c = createChessComClient({ fetch: fakeFetch({}) });
  await expect(c.getRecentGames('nobody_here')).rejects.toMatchObject({ code: 'USER_NOT_FOUND', httpStatus: 404 });
});

test('bad username never touches the network', async () => {
  const f = fakeFetch({});
  const c = createChessComClient({ fetch: f });
  await expect(c.getRecentGames('bad name!')).rejects.toMatchObject({ code: 'INVALID_USERNAME' });
  expect(f.calls).toHaveLength(0);
});

test('429 and network failure map to clear codes', async () => {
  const c1 = createChessComClient({ fetch: fakeFetch({ [`${U}/archives`]: resp({}, 429) }) });
  await expect(c1.getRecentGames('prashanth_x')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  const c2 = createChessComClient({ fetch: fakeFetch({ [`${U}/archives`]: new TypeError('fetch failed') }) });
  await expect(c2.getRecentGames('prashanth_x')).rejects.toMatchObject({ code: 'UPSTREAM' });
});

test('timeouts map to TIMEOUT', async () => {
  const err = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
  const c = createChessComClient({ fetch: fakeFetch({ [`${U}/archives`]: err }) });
  await expect(c.getRecentGames('prashanth_x')).rejects.toMatchObject({ code: 'TIMEOUT', httpStatus: 504 });
});

test('getGameById finds one game and rejects malformed input', async () => {
  const c = createChessComClient({ fetch: fakeFetch(routes()) });
  expect((await c.getGameById('prashanth_x', '2', '2026/11')).id).toBe('2');
  await expect(c.getGameById('prashanth_x', '999', '2026/11')).rejects.toMatchObject({ code: 'GAME_NOT_FOUND' });
  await expect(c.getGameById('prashanth_x', '2', '../../x')).rejects.toBeInstanceOf(ChessComError);
});

test('repeat calls within the TTL use the cache', async () => {
  const f = fakeFetch(routes());
  const c = createChessComClient({ fetch: f });
  await c.getRecentGames('prashanth_x', { limit: 1 });
  await c.getRecentGames('prashanth_x', { limit: 1 });
  expect(f.calls).toHaveLength(2);
});