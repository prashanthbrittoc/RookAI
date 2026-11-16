# 10-11-2026: WASM vs native on Railway
- Measured 5 positions on Railway (single run each, host showed 48 CPUs):
  depth 12: native 299 ms, WASM 117 ms; depth 16: native 1310 ms, WASM 1457 ms.
- Speed was roughly equal; engines disagreed on best move in several positions
  (native is full-strength with the large network, WASM is the lite build).
- Decision: native, because speed is equal and evaluation quality is higher.
  Needs a Dockerfile (already working). Fallback: WASM.
- Gotchas: Dockerfile must be named exactly "Dockerfile" (Linux is case-sensitive);
  Root Directory must be set to /server/bench.

# 16-11-2026: v1 vs v2
 Mistakes are tagged by theme using verified facts (mate, capture, opening) and each theme has its own coaching hint, because one generic prompt gave generic tips.
- Level bands (beginner/improving/intermediate) change vocabulary and how much is explained.
- Guard: skip when played move equals the engine best move (depth noise).
- Prompt versioned (PROMPT_VERSION) so cached results from an old prompt can be told apart.
- Scorecard result: v1 27/29 clean -> v2 26/29 clean on 1 mistakes. Remaining failures: 2 .