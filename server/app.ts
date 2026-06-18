import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { createAuth } from './auth';
import { openDatabase } from './db/connection';
import { migrateAppSchema } from './db/schema';
import { createAuthRoutes } from './routes/auth';
import { errorHandler, notFound } from './routes/errors';

export interface CreateAppOptions {
  databasePath?: string;
  staticDir?: string | null;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const databasePath = options.databasePath ?? path.resolve(process.cwd(), 'data/erph.sqlite');
  const db = openDatabase(databasePath);
  migrateAppSchema(db);
  const auth = createAuth(databasePath);
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGIN ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.has(origin));
      },
    }),
  );
  const authHandler = toNodeHandler(auth);
  app.all('/api/auth/{*any}', (req, res, next) => {
    if (req.path === '/api/auth/me') {
      return next();
    }

    return authHandler(req, res);
  });
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use(express.json({ limit: '1mb' }));
  app.use('/api', createAuthRoutes(auth, db));
  app.use('/api', notFound);

  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(options.staticDir as string, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
