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

# 21-11-2026: Resilience and cost control for LLM calls
- Used the SDK's built-in retries (maxRetries 3, 30 s timeout) instead of a custom backoff loop.
- Errors classified retryable vs not (429/5xx/network vs 401/400/bad output) so the Week 4 queue can decide.
- Max 5 explanations per game and concurrency 3
- Failures are per item: a game returns partial results plus a failures list.
- Game summary computed in code, not by the LLM: exact, free, instant.

## 2026-11-06: Caching analyses in MongoDB
- Key = hash of (moves, color, depth, level, model, prompt version, analysis version). Headers, clocks and usernames excluded, so identical games from different users share one result.
- Hash uses the move list, not the PGN text, so clock comments don't cause misses.
- Only complete results are cached; partial ones are returned but not stored.
- Cache failures never fail the request (cache is an optimization).
- Duplicate protection: in-flight map (one process) + unique index with duplicate-key handling (many processes).
- Measured: miss vs hit timings
- Known limit: changing PROMPT_VERSION or ANALYSIS_VERSION orphans old documents (no cleanup yet).

## Week 2 recap (Nov 2 - 8)
Shipped: Claude explanation pipeline (JSON output, themes, levels), invented-move check,
resilience (retries, error classes, concurrency), MongoDB cache with usage events and a report,
restructure into src/.

Numbers:
- Cost per explained game: $0.000322 (Haiku). Tokens per game: 1680 in / 308 out.
- Cache miss: 3.331 s, $0.0007401. Cache hit: 117.691 ms, $0.
- Scorecard: 27/29 explanations clean on 29 real mistakes.
- Tests: 72 passing. 

Known limitations: old cache entries are never cleaned up; the in-flight dedupe only works within one
process; theme tagging is a heuristic; explanations are only as good as the engine facts.

- Built a pipeline that detects blunders with Stockfish and generates plain-English coaching with the Claude API, validating output against engine-verified facts.
- Cut repeat-analysis cost to $0 with a MongoDB cache keyed on game, player, depth and prompt version; 
  cache hits return in 118 ms vs 3.3 s.
- Added retries, error classification and bounded concurrency;

## 2026-11-__: Chess.com service
- The server fetches PGNs itself; the client sends (username, gameId, archive), never raw PGN. Only real games get analyzed, and the browser can't send junk.
- archive month travels with the game ID so fetching one game costs one request, not a search.
- Usernames validated against a strict pattern before building URLs (no path injection).
- Typed errors with codes (USER_NOT_FOUND, RATE_LIMITED, TIMEOUT...) carry an HTTP status, so the API error handler stays trivial.
- Sequential month fetches, short TTL cache and a descriptive User-Agent, to be a polite API client.
- Variants and games without PGN are filtered out (we only analyze standard chess).