import { Router } from 'express';
import { z } from 'zod';
import { withUser } from '../db/pool';
import { ApiError } from '../lib/http';
import { requireActive, requireSession, type AuthedRequest } from '../middleware/session';
import { createRecord, deleteRecord, listRecords, updateRecord } from '../repositories/rph-records';

const contentSchema = z.object({
  bidang: z.string().optional(),
  tajukStandardKandungan: z.string().optional(),
  objektif: z.string().optional(),
  aktiviti: z.string().optional(),
  refleksi: z.string().optional(),
  sp: z.array(z.string()).optional(),
  spi: z.array(z.object({ tp: z.number(), desc: z.string() })).optional(),
});

const recordSchema = z.object({
  tarikh: z.string().min(1),
  hari: z.string().min(1),
  tahun: z.number().int().min(1).max(6),
  kelas: z.string().min(1),
  masa: z.string().min(1),
  subjek: z.string().min(1),
  content: contentSchema.default({}),
  status: z.enum(['draft', 'published']).optional(),
});

const patchSchema = recordSchema.partial();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).default(''),
});

export function createRecordRoutes() {
  const router = Router();
  const active = [requireSession(), requireActive] as const;

  router.get('/records', ...active, async (req: AuthedRequest, res, next) => {
    try {
      const query = listSchema.safeParse(req.query);
      if (!query.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Parameter senarai tidak sah.');
      }

      const result = await withUser(req.profile!.id, (db) => listRecords(db, req.profile!.id, query.data));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/records', ...active, async (req: AuthedRequest, res, next) => {
    try {
      const parsed = recordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Data rekod tidak lengkap atau tidak sah.');
      }

      const record = await withUser(req.profile!.id, (db) => createRecord(db, req.profile!.id, parsed.data));
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/records/:id', ...active, async (req: AuthedRequest, res, next) => {
    try {
      const body = patchSchema.safeParse(req.body);
      if (!body.success) {
        throw new ApiError(400, 'BAD_REQUEST', 'Data rekod tidak sah.');
      }

      const record = await withUser(req.profile!.id, (db) => updateRecord(db, String(req.params.id), body.data));
      if (!record) {
        throw new ApiError(404, 'NOT_FOUND', 'Rekod tidak dijumpai atau bukan milik anda.');
      }

      res.json({ record });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/records/:id', ...active, async (req: AuthedRequest, res, next) => {
    try {
      const deleted = await withUser(req.profile!.id, (db) => deleteRecord(db, String(req.params.id)));
      if (!deleted) {
        throw new ApiError(404, 'NOT_FOUND', 'Rekod tidak dijumpai atau bukan milik anda.');
      }

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
