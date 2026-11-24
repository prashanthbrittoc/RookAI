import { Engine } from './engine.mjs'
import 'dotenv/config'

export async function createEngine() {
  const engine = process.env.ENGINE_CMD
    ? new Engine(process.env.ENGINE_CMD, (process.env.ENGINE_ARGS || '').split(' ').filter(Boolean))
    : new Engine('stockfish')
  await engine.init();
  return engine;
}