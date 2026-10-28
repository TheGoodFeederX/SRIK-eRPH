import { Router } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool.js';
import { ApiError } from '../lib/http.js';
import { requireActive, requireSession, type AuthedRequest } from '../middleware/session.js';
import { renameProfile } from '../repositories/profiles.js';

const renameSchema = z.object({ name: z.string().trim().min(1).max(120) });

export function createProfileRoutes() {
  const router = Router();

  router.get('/session', requireSession({ optional: true }), (req: AuthedRequest, res) => {
    // Anonymous callers get a 200 with nulls so a fresh browser shows the login page
    // instead of a connection error.
    res.json({
      user: req.authUser ?? null,
      profile: req.profile ?? null,
      role: req.profile?.role ?? null,
      status: req.profile?.status ?? null,
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
