import { Router } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool';
import { ApiError } from '../lib/http';
import { requireActive, requireSession, type AuthedRequest } from '../middleware/session';
import { renameProfile } from '../repositories/profiles';

const renameSchema = z.object({ name: z.string().trim().min(1).max(120) });

export function createProfileRoutes() {
  const router = Router();

  router.get('/session', requireSession(), (req: AuthedRequest, res) => {
    res.json({
      user: req.authUser,
      profile: req.profile,
      role: req.profile?.role,
      status: req.profile?.status,
    });
  });

  router.patch('/profile', requireSession(), requireActive, async (req: AuthedRequest, res, next) => {
    try {
      const parsed = renameSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Nama tidak sah.');
      }

      const profile = await withUser(req.profile!.id, (db) => renameProfile(db, parsed.data.name));
      if (!profile) {
        throw new ApiError(404, 'NOT_FOUND', 'Profil tidak dijumpai.');
      }

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
