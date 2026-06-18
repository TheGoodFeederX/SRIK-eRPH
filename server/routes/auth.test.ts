import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthInstance } from '../auth';
import { createApp } from '../app';
import { openDatabase } from '../db/connection';
import { migrateAppSchema } from '../db/schema';
import { setAdminRole } from '../repositories/profiles';
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

  it('signs up and reads the app profile through a Better Auth session', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erph-auth-'));
    const databasePath = path.join(tempDir, 'auth.sqlite');
    const app = createApp({ databasePath, staticDir: null });
    const agent = request.agent(app);

    const signUp = await agent.post('/api/auth/sign-up/email').send({
      email: 'teacher@example.com',
      password: 'password123',
      name: 'Teacher Name',
    });
    expect(signUp.status).toBe(200);
    expect(signUp.body.user.email).toBe('teacher@example.com');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ email: 'teacher@example.com', name: 'Teacher Name' });
    expect(me.body.profile).toMatchObject({
      email: 'teacher@example.com',
      name: 'Teacher Name',
      role: 'teacher',
    });
    expect(me.body.role).toBe('teacher');

    const adminDb = openDatabase(databasePath);
    try {
      setAdminRole(adminDb, 'teacher@example.com');
    } finally {
      adminDb.close();
    }

    const promoted = await agent.get('/api/auth/me');
    expect(promoted.status).toBe(200);
    expect(promoted.body.profile).toMatchObject({ role: 'admin' });
    expect(promoted.body.role).toBe('admin');

    const update = await agent.patch('/api/profile').send({ name: ' Renamed Teacher ' });
    expect(update.status).toBe(200);
    expect(update.body.profile).toMatchObject({ name: 'Renamed Teacher', role: 'admin' });
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
