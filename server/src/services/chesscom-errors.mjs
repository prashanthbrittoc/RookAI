// One error type with a code. Week 3's error handler will map codes to HTTP statuses.
const STATUS = { INVALID_USERNAME: 400, USER_NOT_FOUND: 404, GAME_NOT_FOUND: 404, RATE_LIMITED: 429, UPSTREAM: 502, TIMEOUT: 504 };

export class ChessComError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ChessComError';
    this.code = code;
    this.httpStatus = STATUS[code] ?? 500;
  }
}