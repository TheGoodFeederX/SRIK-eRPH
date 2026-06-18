import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('server app', () => {
  it('responds on /api/health', async () => {
    const app = createApp({ databasePath: ':memory:', staticDir: null });
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
