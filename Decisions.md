# 10-11-2026: WASM vs native on Railway
- Measured 5 positions on Railway (single run each, host showed 48 CPUs):
  depth 12: native 299 ms, WASM 117 ms; depth 16: native 1310 ms, WASM 1457 ms.
- Speed was roughly equal; engines disagreed on best move in several positions
  (native is full-strength with the large network, WASM is the lite build).
- Decision: native, because speed is equal and evaluation quality is higher.
  Needs a Dockerfile (already working). Fallback: WASM.
- Gotchas: Dockerfile must be named exactly "Dockerfile" (Linux is case-sensitive);
  Root Directory must be set to /server/bench.