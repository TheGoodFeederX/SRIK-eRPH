import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

  it('returns API JSON 404 before the production SPA fallback', async () => {
    const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erph-static-'));
    fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>spa</title>');

    const app = createApp({ databasePath: ':memory:', staticDir });
    const response = await request(app).get('/api/missing');

    expect(response.status).toBe(404);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });
});
