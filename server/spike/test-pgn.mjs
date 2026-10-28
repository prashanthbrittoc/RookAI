import fs from "fs"
import { getPositions } from "./pgn.mjs"

const pgn = fs.readFileSync(process.argv[2],'utf8')

try {
    const positions = getPositions(pgn)

    console.log('Total half-moves: ',positions.length)
    console.log('First move: ',positions[0])
    console.log('Last move: ',positions[positions.length-1])
}
catch (err) {
    console.log("Error: ",err.message)
}