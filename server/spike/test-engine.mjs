import { evaluateFen } from "./engine.mjs"

const ENGINE = process.argv[2]

const tests = [
    ['Start position', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'],
    ['Mate in 1', '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1'],
    ['Already checkmated', 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3']
];

(async () => {
    for (const [name,fen] of tests) {
        const result = await evaluateFen(ENGINE,fen,12)
        console.log(name,'-->',result)
    }
})()