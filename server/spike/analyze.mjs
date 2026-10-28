import fs from "fs"
import { getPositions } from "./pgn.mjs"
import { evaluateFen } from "./engine.mjs"

const pgn = fs.readFileSync(process.argv[2],'utf8')
const ENGINE = process.argv[3];

( async () => {
    try {
        const positions = getPositions(pgn)

        for (const p of positions.slice(0,5))
        {
            const result = await evaluateFen(ENGINE,p.fenBefore,15)
            console.log(p.moveNumber,"-->",result)
        }
    }
    catch (err) {
        console.log("Error: ",err.message)
    }
})()