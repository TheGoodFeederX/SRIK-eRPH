# Deploy: Neon (data + auth) + Vercel (frontend + API)

## 1. Neon

Projek: `srik-erph` (region `aws-ap-southeast-1`, Postgres 18).

| Nilai | Di mana |
|---|---|
| `DATABASE_URL` (pooled) | Neon Console → Connect → *Pooled connection* |
| `NEON_AUTH_BASE_URL` | Neon Console → Auth → Base URL (`https://<endpoint>.neonauth.<region>.aws.neon.tech/<db>/auth`) |

Skema dan RLS:

```bash
DATABASE_URL=... pnpm db:migrate
DATABASE_URL=... pnpm seed:dskp
```

Migrasi mencipta role `app_user` (tanpa BYPASSRLS), polisi RLS, dan fungsi
`SECURITY DEFINER` (`admin_set_membership`, `admin_upsert_dskp`, `admin_delete_dskp`,
`upsert_self_profile`). Semua idempoten — boleh dijalankan berulang.

## 2. Vercel

Projek: `srik-erph` (Vite, output `dist/`, fungsi `api/index.ts`).

Environment Variables (Production + Preview):

| Nama | Nilai | Nota |
|---|---|---|
| `DATABASE_URL` | connection string **pooled** | server sahaja |
| `NEON_AUTH_BASE_URL` | URL Auth Neon | server sahaja |
| `NEON_AUTH_TRUSTED_ORIGIN` | `https://<projek>.vercel.app` | dihantar semasa login/daftar |
| `APP_ORIGIN` / `CORS_ORIGIN` | `https://<projek>.vercel.app` | CORS + redirect reset kata laluan |

Jangan sekali-kali beri awalan `VITE_` kepada mana-mana nilai di atas: apa sahaja dengan
awalan itu dibakar ke dalam bundle pelayar (audit TC-NEON-SECRET-01).

`vercel.json` mengarahkan `/api/*` ke fungsi Express dan selebihnya ke SPA.

## 3. Selepas deploy

1. Neon Console → Auth → **Trusted origins** tambah domain Vercel.
2. Daftar akaun pentadbir melalui UI, kemudian `pnpm seed:admin <email>` dengan
   `DATABASE_URL` produksi.
3. Semak: `curl https://<projek>.vercel.app/api/health` → `{"ok":true}`.
4. Ujian penerimaan manual: login → rekod baru → senarai → edit → padam → PDF/Excel →
   log keluar → login akaun kedua (pastikan draf dan rekod tidak bercampur).

## 4. Rollback

* **Kod:** Vercel → Deployments → *Promote to Production* pada deployment sebelumnya.
* **Data:** Neon → Branches → *Restore* (point-in-time) ke branch baharu, kemudian tukar
  `DATABASE_URL`. Uji pada branch sebelum menukar produksi.

## 5. Verifikasi keselamatan berkala

* `pnpm test` (termasuk ujian RLS: guru tidak boleh tulis DSKP, akaun `pending` tiada akses,
  `admin` boleh urus DSKP + keahlian).
* `pnpm audit --prod` dan Dependabot alerts.
* Semak Neon: `select * from public.audit_events order by created_at desc limit 20;`
