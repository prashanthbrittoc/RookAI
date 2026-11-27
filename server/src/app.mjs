import express from 'express';
import cookieParser from 'cookie-parser';
import { createAuthRouter } from './routes/auth.mjs';
import { errorHandler } from './middleware/error-handler.mjs';

export function createApp({ auth }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/auth', createAuthRouter({ auth }));

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.use(errorHandler);
  return app;
}