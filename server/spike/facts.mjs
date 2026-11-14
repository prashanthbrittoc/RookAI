import { Chess } from "chess.js"

export function uciToSan(fen, uci)
{
    if (!uci || uci === '(none)') return null
    
    try {
        const chess = new Chess(fen)
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
  const played = describeMove(m.fenBefore, m.playedUci);
  const best = describeMove(m.fenBefore, m.bestUci);
  const reply = describeMove(m.fenAfter, m.replyUci);

  return {
    player: m.color === 'w' ? 'White' : 'Black',
    moveNumber: m.moveNumber,
    label: m.label,
    pawnsLost: Math.round(m.loss / 100),
    played: m.played,
    playedPiece: played?.piece ?? null,
    best: best?.san ?? null,
    bestPiece: best?.piece ?? null,
    bestCaptures: best?.captures ?? null,
    bestGivesCheck: best?.givesCheck ?? false,
    opponentReply: reply?.san ?? null,
    replyPiece: reply?.piece ?? null,
    replyCaptures: reply?.captures ?? null,
    replyGivesCheck: reply?.givesCheck ?? false,
    replyIsMate: reply?.isMate ?? false,
    board: new Chess(m.fenBefore).ascii(),
  };
}

const PIECE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king'}

export function describeMove(fen, uci) {

    if (!uci || uci == '(none)') return null
    try {
        const chess = new Chess(fen)
        const m = chess.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4]})
        return {
            san: m.san,
            piece: PIECE[m.piece],
            captures: m.captured? PIECE[m.captured]: null,
            givesCheck: chess.isCheck(),
            isMate: chess.isCheckmate()
        }
    } catch {
        return null
    }
}