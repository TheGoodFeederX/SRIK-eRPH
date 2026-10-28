# Status pembetulan audit (27 Okt 2026)

Rujukan: `Audit-Keselamatan-Kefungsian-SRIK-eRPH-2026-10-27.md`.

| ID | Dapatan | Status | Pembetulan |
|---|---|---|---|
| F-01 | Dua `AuthContext` | **Selesai** | Satu konteks: `src/context/AuthContext.tsx`; `src/hooks/useAuth.ts` hanya re-export |
| S-01 | Guru boleh tulis DSKP | **Selesai** | RLS `referensi_rph` baca ahli aktif sahaja; tulis hanya melalui `admin_upsert_dskp` / `admin_delete_dskp` yang menyemak `is_active_admin()` |
| A-01 | Supabase + SQLite bercanggah | **Selesai** | Supabase/SQLite dibuang; Neon Postgres + Neon Auth melalui API `/api/*`. SQL lama di `legacy/supabase/` |
| D-01 | `tahun` tiada dalam skema | **Selesai** | `rph_records.tahun integer not null check (between 1 and 6)` |
| D-02 | `TRUNCATE` dalam seed | **Selesai** | `server/db/seed-dskp.ts` guna `on conflict do nothing`; SQL lama diarkib |
| S-02 | Pendaftaran terbuka | **Selesai** | Akaun baru `status = 'pending'`; semua route data memerlukan status `active`; tab `Pengguna` untuk kelulusan |
| F-02 | Borang DSKP tiada SP/SPI | **Selesai** | Editor `bidang`, `sp[]`, `spi[{tp,desc}]`, validasi sekurang-kurangnya satu SP |
| S-03 | Draf localStorage dikongsi | **Selesai** | Kunci `erph_form_draft:<user id>`; tiada token dalam localStorage |
| O-01 | `tsx` dalam devDependencies | **Selesai** | `pnpm build` = typecheck + bundle; API di Vercel melalui `api/index.ts`; `pnpm start` untuk Node |
| D-03 | Skrip cleanup merosakkan data | **Selesai** | Skrip cleanup dibuang; kunci unik `(subjek, tahun, coalesce(bidang,''), sk)` menghalang pendua |
| F-03 | Ralat senyap | **Selesai** | `useRecords` menyimpan `error`, komponen memaparkan `role="alert"`, delete/update `throw` |
| F-04 | Status draf/diterbitkan palsu | **Selesai** | Lajur `status` + checkbox terbit dalam langkah Semakan |
| S-04 | Profil terlalu luas | **Selesai** | `app_user` hanya boleh `update (name, email, updated_at)` baris sendiri; `role`/`status` tidak boleh disentuh |
| S-05 | Kata laluan semasa tidak disahkan | **Selesai** | `POST /api/auth/change-password` → Neon Auth `change-password`; sesi dibatalkan selepas tukar |
| S-06 | `xlsx@0.18.5` advisori | **Selesai** | Diganti dengan `exceljs` |
| S-07 | `pdfmake` advisori SSRF (server) | **Diminimumkan** | PDF masih dijana dalam pelayar sahaja; tiada laluan server. Naik taraf bila versi tampal keluar |
| F-05 | Carian string mentah | **Selesai** | Carian melalui parameter SQL (`ilike` + escape `% _ \`), had 120 aksara |
| F-06 | Tarikh UTC | **Selesai** | `todayMalaysia()` (`Asia/Kuala_Lumpur`) + ujian |
| F-07 | Pilihan merentas halaman | **Selesai** | Pilihan direset bila `page`/`searchTerm` berubah; nombor halaman 1-based |
| F-08 | Semua DSKP dimuat di klien | **Selesai** | `GET /api/dskp` dengan pagination/carian server + `GET /api/dskp/meta` |
| O-02 | Fail DB tidak di-ignore | **Selesai** | `.gitignore`: `data/`, `*.sqlite*`, `*.db`, `*.dump`, `.vercel` |
| O-03 | Tiada CI/ujian | **Separa** | Ujian `server/routes/api.test.ts`, `server/db/rls.test.ts`, `src/lib/dateUtils.test.ts`. CI/E2E belum |
| O-04 | README template | **Selesai** | README baharu |
| O-05 | Tiada polisi backup | **Dokumen** | `docs/DEPLOY-NEON-VERCEL.md` (rollback, restore, audit) |

## Belum selesai (perlu tindakan pemilik)

1. **Trusted origins Neon Auth** — API pengurusan yang tersedia tidak mendedahkan endpoint
   konfigurasi, jadi domain Vercel mesti ditambah melalui Neon Console → Auth.
2. **`pdfmake` 0.3.5** — semak versi baharu yang menampal GHSA-wp52-r2fp-4vmr.
3. **CI (GitHub Actions)** dan ujian E2E Playwright untuk aliran login → rekod → PDF.
4. **Migrasi data legasi** — jika ada data Supabase/SQLite sebenar, eksport dan import
   mengikut Bahagian 1A.5 laporan; ID pengguna mesti dipetakan sebelum RPH diimport.
