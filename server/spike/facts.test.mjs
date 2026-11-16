import { describeMove, themeOf } from "./facts.mjs"

const baseFacts = {
  replyIsMate: false,
  bestIsMate: false,
  replyCaptures: null,
  bestCaptures: null,
  moveNumber: 20,
  cpLoss: 0
};

describe('detects a capture', () => {

    const fen = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'
    const r = describeMove(fen, 'e4d5')
    test('piece', () => expect(r.piece).toBe('pawn'))
    test('captures', () => expect(r.captures).toBe('pawn'))
    test('Check', () => expect(r.givesCheck).toBe(false))
})

describe('detects a checkmate', () => {

    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2'
    const r = describeMove(fen,'d8h4')
    test('piece', () => expect(r.piece).toBe('queen'))
    test('captures', () => expect(r.captures).toBe(null))
    test('Check', () => expect(r.givesCheck).toBe(true))
    test('Checkmate', () => expect(r.isMate).toBe(true))
})

describe('themeOf', () => {
  test('returns allowed-mate when the reply is checkmate', () => {
    expect(themeOf({ ...baseFacts, replyIsMate: true })).toBe('allowed-mate');
  });

  test('returns missed-mate when the best move was mate', () => {
    expect(themeOf({ ...baseFacts, bestIsMate: true })).toBe('missed-mate');
  });

  test('returns hung-piece when the reply captures a non-pawn piece', () => {
    expect(themeOf({ ...baseFacts, replyCaptures: 'knight' })).toBe('hung-piece');
  });

  test('returns missed-capture when the best reply captures a non-pawn piece', () => {
    expect(themeOf({ ...baseFacts, bestCaptures: 'rook' })).toBe('missed-capture');
  });

  test('a pawn capture alone does not count as hung-piece', () => {
    expect(themeOf({ ...baseFacts, replyCaptures: 'pawn' })).toBe('general');
  });

  test('returns opening for an early move with no other theme', () => {
    expect(themeOf({ ...baseFacts, moveNumber: 5 })).toBe('opening');
  });

  test('returns general when nothing else matches', () => {
    expect(themeOf(baseFacts)).toBe('general');
  });

  test('allowed-mate wins over hung-piece (most specific rule first)', () => {
    expect(
      themeOf({ ...baseFacts, replyIsMate: true, replyCaptures: 'queen' })
    ).toBe('allowed-mate');
  });

  test('large loss with no other theme is a blunder', () => {
    expect(themeOf({ ...baseFacts, cpLoss: 450 })).toBe('blunder');
    });
});