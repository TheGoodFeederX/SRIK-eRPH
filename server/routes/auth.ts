import { Router, type Response } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool.js';
import { ApiError } from '../lib/http.js';
import { authCookieName, neonAuth } from '../lib/neon-auth.js';
import { readSessionToken, requireSession, type AuthedRequest } from '../middleware/session.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(120),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(res: Response, cookiePair: string) {
  // Reuse Neon Auth's signed value verbatim; re-encoding it would break verification.
  const [name, ...value] = cookiePair.split('=');
  const attributes = [
    `${name}=${value.join('=')}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`,
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(res: Response) {
  res.clearCookie(authCookieName(), { path: '/' });
}

async function profileFor(userId: string, email: string) {
  return withUser(userId, async (db) => {
    const result = await db.query('select * from public.upsert_self_profile($1)', [email]);
    return result.rows[0];
  });
}

export function createAuthRoutes() {
  const router = Router();

  router.post('/auth/register', async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'E-mel atau kata laluan tidak sah (minimum 8 aksara).');
      }

      const result = await neonAuth.signUp(parsed.data);
      if (!result.ok || !result.sessionCookie || !result.user) {
        throw new ApiError(400, 'BAD_REQUEST', result.message ?? 'Pendaftaran gagal.');
      }

      setSessionCookie(res, result.sessionCookie);
      const profile = await profileFor(result.user.id, result.user.email);
      res.status(201).json({ user: result.user, profile });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const parsed = credentialsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'E-mel atau kata laluan tidak sah.');
      }

      const result = await neonAuth.signIn(parsed.data);
      if (!result.ok || !result.sessionCookie || !result.user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'E-mel atau kata laluan salah.');
      }

      setSessionCookie(res, result.sessionCookie);
      const profile = await profileFor(result.user.id, result.user.email);
      res.json({ user: result.user, profile });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/logout', async (req: AuthedRequest, res, next) => {
    try {
      const cookiePair = readSessionToken(req);
      if (cookiePair) {
        await neonAuth.signOut(cookiePair).catch(() => undefined);
      }
      clearSessionCookie(res);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/change-password', requireSession(), async (req: AuthedRequest, res, next) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Kata laluan baharu perlu sekurang-kurangnya 8 aksara.');
      }

      // Neon Auth verifies the current password server-side (audit S-05).
      const result = await neonAuth.changePassword(req.sessionToken!, parsed.data);
      if (!result.ok) {
        throw new ApiError(400, 'BAD_REQUEST', result.message ?? 'Kata laluan semasa tidak sah.');
      }

      clearSessionCookie(res);
      res.json({ ok: true, reauthenticate: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/forgot-password', async (req, res, next) => {
    try {
      const parsed = z.object({ email: z.string().trim().email() }).safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'E-mel tidak sah.');
      }

      await neonAuth.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: process.env.APP_ORIGIN ?? 'http://localhost:5173/reset-password',
      });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
