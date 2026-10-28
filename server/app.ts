import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './lib/http.js';
import { createAdminRoutes } from './routes/admin.js';
import { createAuthRoutes } from './routes/auth.js';
import { createDskpRoutes } from './routes/dskp.js';
import { createProfileRoutes } from './routes/profile.js';
import { createRecordRoutes } from './routes/records.js';

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN ?? process.env.APP_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    res.setHeader('x-frame-options', 'DENY');
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', createAuthRoutes());
  app.use('/api', createProfileRoutes());
  app.use('/api', createRecordRoutes());
  app.use('/api', createDskpRoutes());
  app.use('/api', createAdminRoutes());
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
