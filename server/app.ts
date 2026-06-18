import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './routes/errors';

export interface CreateAppOptions {
  databasePath?: string;
  staticDir?: string | null;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use(express.json({ limit: '1mb' }));

  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(options.staticDir as string, 'index.html'));
    });
  }

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
