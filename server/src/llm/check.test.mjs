import { findUnknownMoves } from "./check.mjs"

const facts = { played: 'Bh3', best: 'Nf6', opponentReply: 'Bxh3'}

describe('find Unknown Moves', () => {
    test('allows moves that are in the facts', () => {
        expect(findUnknownMoves('After Bh3, Black plays Bxh3. Nf6 was better.',facts)).toEqual([])
    })

    test('flags an invented move', () => {
        expect(findUnknownMoves('You should have played Qh5',facts)).toEqual(['Qh5'])
    })

    test('ignores checkmarks', () => {
        expect(findUnknownMoves('Nf6+ was a mistake',facts)).toEqual([])
    })
})

