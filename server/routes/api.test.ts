import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

/**
 * Unauthenticated access must be rejected before any data query runs,
 * so these cases need no database (audit TC-NEON-RLS-02, TC-AUTH-01).
 */
describe('api auth boundary', () => {
  const app = createApp();

  it('serves a health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it.each([
    ['get', '/api/records'],
    ['get', '/api/dskp'],
    ['get', '/api/admin/members'],
    ['post', '/api/records'],
    ['patch', '/api/profile'],
  ])('rejects unauthenticated %s %s', async (method, path) => {
    const response = await request(app)[method as 'get' | 'post' | 'patch'](path);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('answers the session probe with nulls instead of 401', async () => {
    const response = await request(app).get('/api/session');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: null, profile: null });
  });

  it('returns 404 for unknown api routes', async () => {
    const response = await request(app).get('/api/nope');
    expect(response.status).toBe(404);
  });
});
