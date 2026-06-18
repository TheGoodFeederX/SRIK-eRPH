import { Router } from 'express';
import { z } from 'zod';
import type { AuthInstance } from '../auth';
import type { AppDatabase } from '../db/connection';
import { updateProfileName } from '../repositories/profiles';
import { ApiError } from './errors';
import { requireSession, type AuthedRequest } from './session';

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export function createAuthRoutes(auth: AuthInstance, db: AppDatabase) {
  const router = Router();
  const session = requireSession(auth, db);

  router.get('/auth/me', session, (req: AuthedRequest, res) => {
    res.json({ user: req.authUser, profile: req.profile, role: req.profile?.role });
  });

  router.patch('/profile', session, (req: AuthedRequest, res, next) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success || !req.authUser) {
      return next(new ApiError(400, 'BAD_REQUEST', 'Valid name is required.'));
    }

    const profile = updateProfileName(db, req.authUser.id, parsed.data.name);
    return res.json({ profile });
  });

  return router;
}
