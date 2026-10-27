import { spawn } from "child_process"
import { resolve } from "dns"

function evaluateFen(enginepath, fen, depth=12)
{
    return new Promise((resolve,reject) => {
        
        const engine = spawn('node',[enginepath])
        let buffer = ''
        let lastscore = null

        engine.stdout.on('data', (chunk) => {
            buffer += chunk.toString()
            const lines = buffer.split('\n')
            buffer = lines.pop()

            for (const raw of lines)
            {
                const line = raw.trim()
                const scoreMatch = line.match(/^info .*score (cp|mate) (-?\d+)/)
                if (scoreMatch) 
                {
                    lastscore = {type: scoreMatch[1], value: parseInt(scoreMatch[2],10)}
                }
                const bestMatch = line.match(/^bestmove (\S+)/)
                if (bestMatch)
                {
                    engine.stdin.write('quit\n')
                    resolve({ bestMove: bestMatch[1], score: lastscore})
                }
            }
        })
        engine.on('error',reject)
        
        engine.stdin.write('uci\n')
        engine.stdin.write('isready\n')
        engine.stdin.write(`position fen ${fen}\n`)
        engine.stdin.write(`go depth ${depth}\n`)
    })
}

export { evaluateFen }