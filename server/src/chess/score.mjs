
const CAP = 1000

export function scoreToCp(score)
{
    let cp

    if (score.type === "mate") cp = score.value > 0 ? CAP : -CAP
    else cp = score.value

    return Math.max(-CAP, Math.min(CAP,cp))
}

export function moveLoss(beforeCp, afterRawCp)
{
    return Math.max(0, beforeCp+afterRawCp)
}