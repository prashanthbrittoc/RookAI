import { levelBand } from "./level.mjs"

describe('levelBand', () => {
    test('Beginner', () => expect(levelBand(500)).toBe('beginner'))
    test('improving', () => expect(levelBand(800)).toBe('improving'))
    test('intermediate', () => expect(levelBand(1200)).toBe('intermediate'))
})