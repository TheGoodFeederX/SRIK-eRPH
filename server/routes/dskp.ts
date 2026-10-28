import { Router } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool';
import { ApiError } from '../lib/http';
import { requireActive, requireAdmin, requireSession, type AuthedRequest } from '../middleware/session';
import { deleteDskp, getDskpMeta, listDskp, upsertDskp } from '../repositories/dskp';

const spiItem = z.object({ tp: z.number().int().min(0), desc: z.string().min(1) });

const dskpSchema = z.object({
  subjek: z.string().trim().min(1).max(120),
  tahun: z.number().int().min(1).max(6),
  bidang: z.string().trim().max(160).nullish(),
  sk: z.string().trim().min(1).max(400),
  sp: z.array(z.string().trim().min(1)).min(1),
  spi: z.array(spiItem).default([]),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(25),
  search: z.string().trim().max(120).optional(),
  subjek: z.string().trim().max(120).optional(),
  tahun: z.coerce.number().int().min(1).max(6).optional(),
});

export function createDskpRoutes() {
  const router = Router();
  const member = [requireSession(), requireActive] as const;

  router.get('/dskp/meta', ...member, async (req: AuthedRequest, res, next) => {
    try {
      res.json(await withUser(req.profile!.id, (db) => getDskpMeta(db)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/dskp', ...member, async (req: AuthedRequest, res, next) => {
    try {
      const query = listSchema.safeParse(req.query);
      if (!query.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Parameter carian DSKP tidak sah.');
      }

      res.json(await withUser(req.profile!.id, (db) => listDskp(db, query.data)));
    } catch (error) {
      next(error);
    }
  });

  router.post('/dskp', requireSession(), requireAdmin, async (req: AuthedRequest, res, next) => {
    try {
      const parsed = dskpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'DSKP mesti ada subjek, tahun, SK dan sekurang-kurangnya satu SP.');
      }

      const record = await withUser(req.profile!.id, (db) => upsertDskp(db, null, parsed.data));
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  });

  router.put('/dskp/:id', requireSession(), requireAdmin, async (req: AuthedRequest, res, next) => {
    try {
      const parsed = dskpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'DSKP mesti ada subjek, tahun, SK dan sekurang-kurangnya satu SP.');
      }

      const record = await withUser(req.profile!.id, (db) => upsertDskp(db, String(req.params.id), parsed.data));
      res.json({ record });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/dskp/:id', requireSession(), requireAdmin, async (req: AuthedRequest, res, next) => {
    try {
      const deleted = await withUser(req.profile!.id, (db) => deleteDskp(db, String(req.params.id)));
      if (!deleted) {
        throw new ApiError(404, 'NOT_FOUND', 'Rekod DSKP tidak dijumpai.');
      }

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
