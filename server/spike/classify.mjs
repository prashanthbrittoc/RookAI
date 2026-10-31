export const thresholds = { inaccuracy: 50, mistake: 100, blunder: 300 }

export function classifyLoss(loss) {
    if (loss >= thresholds.blunder) return 'blunder'
    if (loss >= thresholds.mistake) return 'mistake'
    if (loss >= thresholds.inaccuracy) return 'inaccuracy'
    return 'ok'
}

export function pickTopMistakes(moves, {max=5, minLoss=100, color=null} = {}) {
    return moves
    .filter(m => color ? m.color === color : true)
    .filter(m => m.loss >= minLoss)
    .filter(m => m.beforeCp > -600)
    .filter(m => m.afterCp < 600)
    .sort((a,b) => b.loss - a.loss)
    .slice(0,max)
    .sort((a,b) => a.ply - b.ply)
    .map(m => ({...m, label: classifyLoss(m.loss)}))
}