import { describeMove } from "./facts.mjs"

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