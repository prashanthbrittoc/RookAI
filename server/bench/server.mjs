import express from 'express';
import os from 'os';
import { Engine } from './engine.mjs';

const app = express();
const FENS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
  'r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1NBPPP/R2Q1RK1 w - - 0 9',
  '2r2rk1/pp2qppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R2Q1RK1 w - - 0 12',
  'r4rk1/pp3ppp/2n1pq2/3p4/3P4/2P1PN2/PP3PPP/R2QR1K1 w - - 0 15',
];

app.get('/bench', async (req, res) => {
  const depth = Number(req.query.depth || 12);
  const args = process.env.ENGINE_ARGS ? process.env.ENGINE_ARGS.split(' ') : [];
  const engine = new Engine(process.env.ENGINE_CMD || 'stockfish', args);
  try {
    await engine.init();
    const start = Date.now();
    const out = [];
    for (const fen of FENS) {
      const t = Date.now();
      const r = await engine.evaluate(fen, depth);
      out.push({ ms: Date.now() - t, bestMove: r.bestMove });
    }
    engine.quit();
    res.json({
      engine: process.env.ENGINE_CMD,
      depth,
      cpus: os.cpus().length,
      totalMs: Date.now() - start,
      positions: out,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000);