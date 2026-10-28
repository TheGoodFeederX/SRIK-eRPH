# SRIK-eRPH

Rekod Pengajaran Harian (eRPH) digital untuk guru — React + TypeScript + Vite, dengan
API Express dan pangkalan data **Neon PostgreSQL** serta identiti **Neon Managed Auth**.

## Seni bina

```text
Pelayar (SPA Vite di Vercel)
   |  cookie sesi HttpOnly (same-origin)
   v
/api/*  — Express 5 (Vercel serverless / Node)
   |            |
   |            +--> Neon Managed Auth  (login, daftar, tukar kata laluan, sesi)
   v
Neon PostgreSQL
   public.profiles        (role + status keahlian)
   public.rph_records     (RLS: pemilik sahaja)
   public.referensi_rph   (RLS: baca ahli aktif, tulis admin)
   public.audit_events    (log tindakan admin)
```

* Semua pertanyaan aplikasi berjalan sebagai role `app_user` dengan `app.user_id` ditetapkan,
  jadi RLS PostgreSQL menolak akses silang pengguna walaupun kod API tersilap.
* Akaun baharu berstatus `pending` sehingga pentadbir meluluskan (tab `Pengguna`).
* Tiada token atau secret dalam `localStorage`; tiada `DATABASE_URL` dalam bundle pelayar.

## Pembangunan tempatan

```bash
pnpm install
cp .env.example .env          # isi DATABASE_URL, NEON_AUTH_BASE_URL
pnpm db:migrate               # skema Neon (idempoten)
pnpm seed:dskp                # data rujukan DSKP (idempoten, tiada truncate)
pnpm dev                      # Vite :5173 + API :3005
```

Akaun pentadbir pertama:

```bash
# 1. Daftar melalui halaman login, kemudian:
pnpm seed:admin cikgu@sekolah.edu.my
```

## Arahan

| Arahan | Fungsi |
|---|---|
| `pnpm dev` | Klien Vite + API (proxy `/api` → `:3005`) |
| `pnpm build` | Typecheck (`tsc -b`) + bundle klien |
| `pnpm test` | Vitest: unit + sempadan auth API + ujian RLS Neon |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Jalankan `server/db/sql/*.sql` |
| `pnpm seed:dskp` | Seed DSKP idempoten |
| `pnpm seed:admin <email>` | Naik taraf akaun sedia ada kepada admin aktif |
| `pnpm server` | API sahaja (Node, `tsx`) |

`pnpm test` memerlukan `DATABASE_URL` untuk ujian RLS; tanpanya ujian itu dilangkau.

## Deploy

Lihat [`docs/DEPLOY-NEON-VERCEL.md`](docs/DEPLOY-NEON-VERCEL.md).
Pembetulan audit dipetakan dalam [`docs/AUDIT-REMEDIATION.md`](docs/AUDIT-REMEDIATION.md).

## Hak cipta

© eRPH SRI Al-Khairiah. Dibina oleh Cikgu Najmi.
