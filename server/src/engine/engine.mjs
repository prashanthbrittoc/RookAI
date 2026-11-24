import { spawn } from "child_process"

export class Engine{

    constructor( command='stockfish', args=[]) {
        this.proc = spawn(command,args)
        this.buffer = ''
        this.listener = null
        
        this.proc.stdout.on('data', (chunk) => {
            this.buffer += chunk.toString()
            const lines = this.buffer.split('\n')
            this.buffer = lines.pop()
            for (const line of lines) this.listener?.(line.trim())

        })
    }

    send (cmd) {
        this.proc.stdin.write(cmd + '\n')
    }

    waitFor (prefix) {
        return new Promise((resolve) => {
            this.listener = (line) => {
                if (line.startsWith(prefix)) {
                    this.listener = null
                    resolve(line)
                }
            }
        })
    }

    async init() {
        let p = this.waitFor('uciok')
        this.send('uci')
        await p
        p = this.waitFor('readyok')
        this.send('isready')
        await p
    }

    evaluate (fen, depth=12) {
        return new Promise((resolve) => {
            
            let score = null
            this.listener = (line) => {
                const s = line.match(/^info .*score (cp|mate) (-?\d+)/)
                if (s) score = { type: s[1], value: parseInt(s[2],10)}
                const b = line.match(/^bestmove (\S+)/)
                if (b) {
                    this.listener = null
                    resolve({ bestMove: b[1], score})
                }
            }
            this.send(`position fen ${fen}`)
            this.send(`go depth ${depth}`)
        })
    }

    quit() {
        this.send('quit')
    }
}