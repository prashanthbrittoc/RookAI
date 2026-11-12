import { Engine } from './engine.mjs';

export async function createEngine() {
  const engine = process.env.ENGINE_CMD
    ? new Engine(process.env.ENGINE_CMD, (process.env.ENGINE_ARGS || '').split(' ').filter(Boolean))
    : new Engine('stockfish'); // default: native
  await engine.init();
  return engine;
}