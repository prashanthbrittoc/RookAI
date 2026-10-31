import fs from 'fs'
import { pickTopMistakes } from './classify.mjs'

const depth = process.argv[2] || 10
const files = fs.readdirSync('out').filter( f => f.endsWith(`.d${depth}.json`))

for (const f of files )
{
    const { color, moves } = JSON.parse(fs.readFileSync(`out/${f}`, 'utf-8'))
    console.log('\n' + f)
    console.table(
        pickTopMistakes( moves, { color }).map( m => ({
            move: `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${m.played}`,
            label: m.label,
            loss: m.loss,
            best: m.bestUci
        }))
    )
}