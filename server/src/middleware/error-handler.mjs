import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.mjs';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  }
  // HttpError and ChessComError both carry code + status
  const status = err.status ?? err.httpStatus ?? 500;
  if (err instanceof HttpError || err.name === 'ChessComError') {
    return res.status(status).json({ error: { code: err.code, message: err.message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Request body is not valid JSON' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body too large' } });
  }

  console.error(err); // the real error goes to the log, never to the client
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
}