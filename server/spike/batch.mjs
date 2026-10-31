import fs from 'fs'
import path from 'path'
import { analyzeGame } from './analyze-game.mjs'

const ENGINE = process.argv[2]
const depth = Number(process.argv[3] || 10)
const dir = 'games'
fs.mkdirSync('out', { recursive: true })

for (const file of fs.readdirSync(dir).filter( f => f.endsWith('.pgn')))
{
    const color = file.match(/-(w|b)\.pgn$/)?.[1]
    if (!color) 
    {
        console.log('Skip (No color in filename: ',file)
        continue
    }

    const pgn = fs.readFileSync(path.join(dir,file),'utf-8')
    const start = Date.now()
    const { moves } = await analyzeGame(ENGINE,pgn, { depth })
    const secs = ((Date.now() - start)/1000).toFixed(1)

    fs.writeFileSync(`out/${file}.d${depth}.json`, JSON.stringify({ color, moves }))
    console.log(`${file}: ${moves.length} plies, ${secs}s`)
}