import { Chess } from "chess.js"

function getPositions(pgn) {

    if (!pgn || !pgn.trim()) throw new Error("Invalid PGN")

    const chess = new Chess()

    try {
        chess.loadPgn(pgn)
    }
    catch (err)
    {
        throw new Error("Invalid PGN")
    }

    const moves = chess.history({verbose: true})

    if (moves.length == 0) throw new Error("Invalid PGN")

    return moves.map((m,i) => ({
        ply: i+1,
        moveNumber: Math.floor(i/2) + 1,
        color: m.color,
        san: m.san,
        uci: m.from + m.to + (m.promotion || ''),
        fenBefore: m.before,
        fenAfter: m.after
    }))
}

export { getPositions }