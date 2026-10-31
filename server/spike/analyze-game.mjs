import { getPositions } from './pgn.mjs'
import { evaluateFen } from './engine.mjs'
import { scoreToCp, moveLoss } from './score.mjs'
import { pickTopMistakes } from './classify.mjs'

export async function analyzeGame(enginePath, pgn, { depth=10, color=null}  = {}) {
    const positions = getPositions(pgn)
    const fens = [positions[0].fenBefore, ...positions.map(p => p.fenAfter)]

    const evals = []
    for (const fen of fens)
    {
        const r = await evaluateFen(enginePath, fen, depth)
        evals.push({cp: r.score ? scoreToCp(r.score) : -1000, bestMove: r.bestMove})
    }

    const moves = positions.map((p,i) => ({
        ply: p.ply,
        moveNumber: p.moveNumber,
        color: p.color,
        played: p.san,
        playedUci: p.uci,
        bestUci: evals[i].bestMove,
        fenBefore: p.fenBefore,
        fenAfter: p.fenAfter,
        beforeCp: evals[i].cp,
        afterCp: -evals[i+1].cp,
        loss: moveLoss(evals[i].cp,evals[i+1].cp)
    }))

    return { moves, topMistakes: pickTopMistakes(moves,{ color }) }
}