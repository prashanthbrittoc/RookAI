import fs from 'fs'
import { analyzeGame } from './analyze-game.mjs'

const [ENGINE, PGN_FILE, COLOR] = process.argv.slice(2)
const PGN = fs.readFileSync(PGN_FILE, 'utf-8')

console.time('Analysis')
const { topMistakes } = await analyzeGame(ENGINE,PGN, { color: COLOR })
console.timeEnd('Analysis')

console.table(topMistakes.map(m => ({
    move: `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${m.played}`,
    label: m.label,
    loss: m.loss,
    best: m.bestUci
})))