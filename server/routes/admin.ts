import { Router } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool';
import { ApiError } from '../lib/http';
import { requireAdmin, requireSession, type AuthedRequest } from '../middleware/session';
import { listMembers, setMembership } from '../repositories/profiles';

const membershipSchema = z.object({
  role: z.enum(['teacher', 'admin']).nullish(),
  status: z.enum(['pending', 'active', 'disabled']).nullish(),
});

export function createAdminRoutes() {
  const router = Router();
  const admin = [requireSession(), requireAdmin] as const;

  router.get('/admin/members', ...admin, async (req: AuthedRequest, res, next) => {
    try {
      res.json({ members: await withUser(req.profile!.id, (db) => listMembers(db)) });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/admin/members/:id', ...admin, async (req: AuthedRequest, res, next) => {
    try {
      const parsed = membershipSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Peranan atau status tidak sah.');
      }

      const profile = await withUser(req.profile!.id, (db) =>
        setMembership(db, String(req.params.id), parsed.data.role ?? null, parsed.data.status ?? null),
      );
      if (!profile) {
        throw new ApiError(404, 'NOT_FOUND', 'Ahli tidak dijumpai.');
      }

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
