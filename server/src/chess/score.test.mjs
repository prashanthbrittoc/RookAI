import { scoreToCp, moveLoss } from "./score.mjs";

describe('scoreToCp', () => {
    test('Passes centipawns through', () => expect(scoreToCp({type: 'cp', value: 250})).toBe(250))
    test('Clamps huge scores', () => expect(scoreToCp({type: 'cp', value: 2500})).toBe(1000))
    test('treats mate for the mover as +cap and being mated as -cap', () => {
        expect(scoreToCp({ type: 'mate', value: 3 })).toBe(1000)
        expect(scoreToCp({ type: 'mate', value: -2 })).toBe(-1000)
        expect(scoreToCp({ type: 'mate', value: 0 })).toBe(-1000)
    })
})

describe('moveLoss', () => {
  test('good move loses nothing', () => expect(moveLoss(30, -30)).toBe(0))
  test('queen blunder', () => expect(moveLoss(30, 900)).toBe(930))
  test('never negative', () => expect(moveLoss(0, -50)).toBe(0))
})