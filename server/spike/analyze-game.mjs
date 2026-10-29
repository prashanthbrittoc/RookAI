import fs from "fs"
import { getPositions } from "./pgn.mjs"
import { evaluateFen } from "./engine.mjs"
import { scoreToCp,moveLoss } from "./score.mjs"

try {
    const ENGINE = process.argv[2]
    const pgn_file = process.argv[3]
    const depth = 10

    const positions = getPositions(fs.readFileSync(pgn_file,'utf8'))

    const fens = [positions[0].fenBefore, ...positions.map((p) => p.fenAfter)]

    console.log('Analysis')
    const evals = []
    for (let i=0; i<fens.length; i++)
    {
        const r = await evaluateFen(ENGINE,fens[i],depth)
        evals.push({cp: scoreToCp(r.score), bestMove: r.bestMove})
        process.stdout.write(`\rEvaluated ${i+1}/${fens.length}`)
    }
    console.log()
    console.timeEnd('analysis')

    const results = positions.map((p,i) => ({
        moveNo: p.moveNumber,
        color: p.color,
        played: p.san,
        playedUci: p.uci,
        best: evals[i].bestMove,
        loss: moveLoss(evals[i].cp,evals[i+1].cp)
    }))

    console.table(results)
}
catch (err)
{
    console.log("Error: ",err.message)
}