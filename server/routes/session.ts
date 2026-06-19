import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import type { AuthInstance } from '../auth';
import type { AppDatabase } from '../db/connection';
import { getProfile, upsertProfile } from '../repositories/profiles';
import type { Profile } from '../../src/types';
import { ApiError } from './errors';

export interface AuthedRequest extends Request {
  authUser?: { id: string; email: string; name: string };
  profile?: Profile;
}

export function requireSession(auth: AuthInstance, db: AppDatabase) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session?.user) {
        return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required.'));
      }

      const user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
      };
      const existingProfile = getProfile(db, user.id);

      req.authUser = user;
      req.profile = upsertProfile(db, {
        ...user,
        name: existingProfile?.name ?? user.name,
        role: existingProfile?.role,
      });
      return next();
    } catch (error: unknown) {
      return next(error);
    }
  };
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.profile?.role !== 'admin') {
    return next(new ApiError(403, 'FORBIDDEN', 'Admin access required.'));
  }

  return next();
}
