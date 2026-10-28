import type { NextFunction, Request, Response } from 'express';
import type { Profile } from '../../src/types';
import { withUser } from '../db/pool';
import { ApiError } from '../lib/http';
import { authCookieName, neonAuth, type NeonAuthUser } from '../lib/neon-auth';

export interface AuthedRequest extends Request {
  authUser?: NeonAuthUser;
  profile?: Profile;
  sessionToken?: string;
}

/** Returns the exact `name=value` cookie pair issued by Neon Auth (kept encoded). */
export function readSessionToken(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  const names = new Set([authCookieName(), '__Secure-neon-auth.session_token', 'neon-auth.session_token']);
  for (const part of header.split(';')) {
    const pair = part.trim();
    const [rawName] = pair.split('=');
    if (names.has(rawName) && pair.length > rawName.length + 1) {
      return pair;
    }
  }

  return null;
}

/** Resolves the Neon Auth session and the application membership row. */
export function requireSession() {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    try {
      const token = readSessionToken(req);
      const user = await neonAuth.getSession(token);
      if (!token || !user) {
        return next(new ApiError(401, 'UNAUTHORIZED', 'Sesi tamat. Sila log masuk semula.'));
      }

      const profile = await withUser(user.id, async (db) => {
        const result = await db.query<Profile>('select * from public.upsert_self_profile($1)', [user.email]);
        return result.rows[0];
      });

      req.sessionToken = token;
      req.authUser = user;
      req.profile = profile;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/** Blocks every data route until an admin approves the account (audit S-02). */
export function requireActive(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.profile?.status !== 'active') {
    return next(new ApiError(403, 'FORBIDDEN', 'Akaun belum diluluskan pentadbir.'));
  }

  return next();
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.profile?.role !== 'admin' || req.profile.status !== 'active') {
    return next(new ApiError(403, 'FORBIDDEN', 'Akses pentadbir diperlukan.'));
  }

  return next();
}
