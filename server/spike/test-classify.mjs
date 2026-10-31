import assert from "assert"
import { classifyLoss,pickTopMistakes } from "./classify.mjs"

assert.strictEqual(classifyLoss(10), 'ok');
assert.strictEqual(classifyLoss(50), 'inaccuracy');
assert.strictEqual(classifyLoss(150), 'mistake');
assert.strictEqual(classifyLoss(300), 'blunder');

const moves = [
  { ply: 1, color: 'w', loss: 5,   beforeCp: 20,   afterCp: 15 },
  { ply: 5, color: 'w', loss: 400, beforeCp: 50,   afterCp: -350 },
  { ply: 9, color: 'b', loss: 500, beforeCp: 0,    afterCp: -500 },  
  { ply: 11, color: 'w', loss: 150, beforeCp: 900, afterCp: 750 },   
  { ply: 13, color: 'w', loss: 120, beforeCp: -700, afterCp: -820 }, 
  { ply: 15, color: 'w', loss: 200, beforeCp: 30,  afterCp: -170 },
]

const top = pickTopMistakes(moves,{ color: 'w'})
assert.deepStrictEqual(top.map(m => m.ply), [5,15])
assert.strictEqual(top[0].label,'blunder')
console.log('All classify tests passed')