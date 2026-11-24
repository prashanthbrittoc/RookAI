import { classifyLoss, pickTopMistakes } from "./classify.mjs"

describe('classifyLoss', () => {
    test('forOk', () => expect(classifyLoss(10)).toBe('ok'))
    test('forInaccuracy', () => expect(classifyLoss(50)).toBe('inaccuracy'))
    test('forMistake', () => expect(classifyLoss(150)).toBe('mistake'))
    test('forBlunder', () => expect(classifyLoss(300)).toBe('blunder'))
})

const moves = [
  { ply: 1, color: 'w', loss: 5,   beforeCp: 20,   afterCp: 15 },
  { ply: 5, color: 'w', loss: 400, beforeCp: 50,   afterCp: -350 },
  { ply: 9, color: 'b', loss: 500, beforeCp: 0,    afterCp: -500 },  
  { ply: 11, color: 'w', loss: 150, beforeCp: 900, afterCp: 750 },   
  { ply: 13, color: 'w', loss: 120, beforeCp: -700, afterCp: -820 }, 
  { ply: 15, color: 'w', loss: 200, beforeCp: 30,  afterCp: -170 },
]

const top = pickTopMistakes(moves, { color: 'w'})
describe('pickTopMistakes', () => {
    test('MoveNumber', () => expect(top.map(m => m.ply)).toEqual([5,15]))
    test('BlunderMove', () => expect(top[0].label).toBe('blunder'))
})

