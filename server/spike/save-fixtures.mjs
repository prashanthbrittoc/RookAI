import fs from 'fs'
import path from 'path'
import { createEngine } from './create-engine.mjs'
import { analyzeGame } from './analyze-game.mjs'
import { create } from 'domain'

const engine = await createEngine()
const fixtures = []

for (const file of fs.readdirSync('games').filter((f) => f.endsWith('.pgn')).slice(0,6)) {
    const color = file.match(/-(w|b)\.pgn$/)?.[1]
    if (!color) continue
    const pgn = fs.readFileSync(path.join('games',file),'utf-8')
    const { topMistakes } = await analyzeGame(engine, pgn, { depth: 10, color })
    fixtures.push(...topMistakes.map((m) => ({ game: file, ...m})))
}

engine.quit()
fs.mkdirSync('out', { recursive: true })
fs.writeFileSync('out/fixtures.json', JSON.stringify(fixtures, null, 2))
console.log('Saved', fixtures.length, 'mistakes')