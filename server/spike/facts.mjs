import { Chess } from "chess.js"

export function uciToSan(fen, uci)
{
    if (!uci || uci === 'none') return null
    
    try {
        const chess = new chess(fen)
        const move = chess.move({
            from: uci.slice(0,2),
            to: uci.slice(2,4),
            promotion: uci[4]
        })
        return move.san
    } 
    catch {
        return null
    }
}

export function buildFacts(m) {
    return {
        player: m.color === 'w' ? 'White' : 'Black',
        moveNumber: m.moveNumber,
        played: m.played,
        best: uciToSan(m.fenBefore, m.bestUci),
        opponentReply: uciToSan(m.fenAfter, m.replyUci),
        pawnsLost: Math.round(m.loss/100),
        label: m.label,
        board: new Chess(m.fenBefore).ascii()
    }
}