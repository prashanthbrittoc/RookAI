import fs from 'fs'
import { Engine } from './engine.mjs'
import { analyzeGame } from './analyze-game.mjs'
import { explainMistake } from './explain.mjs'
import { createEngine } from './create-engine.mjs'
import { buildFacts } from './facts.mjs'

const [ PGN_FILE, COLOR ] = process.argv.slice(2)

const engine = await createEngine()
await engine.init()
const { topMistakes } = await analyzeGame(engine, fs.readFileSync(PGN_FILE, 'utf-8'), { color: COLOR })
engine.quit()

for (const m of topMistakes)
{
    const { title, explanation, tip, usage } = await explainMistake(m)
    console.log(`\n${m.moveNumber}. ${m.played} (${m.label})`)
    console.log(title)
    console.log(explanation)
    console.log(tip)
    console.log(`tokens: ${usage.input_tokens} in / ${usage.output_tokens} out`)
}