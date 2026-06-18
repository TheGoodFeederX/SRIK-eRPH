import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthInstance } from '../auth';
import { createApp } from '../app';
import { openDatabase } from '../db/connection';
import { migrateAppSchema } from '../db/schema';
import { errorHandler } from './errors';
import { createAuthRoutes } from './auth';

describe('auth routes', () => {
  it('returns 401 from /api/auth/me without a session', async () => {
    const app = createApp({ databasePath: ':memory:', staticDir: null });

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  });

  it('returns 401 from PATCH /api/profile before validating the body without a session', async () => {
    const app = createApp({ databasePath: ':memory:', staticDir: null });

    const response = await request(app).patch('/api/profile').send({ name: '' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  });

  it('returns 400 from PATCH /api/profile with an invalid name for an authenticated session', async () => {
    const db = openDatabase(':memory:');
    migrateAppSchema(db);
    const auth = {
      api: {
        getSession: async () => ({
          user: { id: 'user-1', email: 'teacher@example.com', name: 'Teacher' },
        }),
      },
    } as unknown as AuthInstance;
    const app = express();
    app.use(express.json());
    app.use('/api', createAuthRoutes(auth, db));
    app.use(errorHandler);

    try {
      const response = await request(app).patch('/api/profile').send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { code: 'BAD_REQUEST', message: 'Valid name is required.' } });
    } finally {
      db.close();
    }
  });
});
