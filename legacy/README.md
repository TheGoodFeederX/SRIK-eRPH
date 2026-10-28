# Legacy: Supabase (JANGAN JALANKAN)

`legacy/supabase/*.sql` ialah migrasi/seed Supabase asal. Ia **arkib sahaja** dan tidak
digunakan oleh aplikasi lagi:

- `01_initial_schema.sql` tidak mempunyai lajur `tahun` (audit D-01).
- `02_security_policies.sql` membenarkan semua pengguna `authenticated` menulis DSKP (audit S-01).
- `04_dskp_seed.sql` bermula dengan `truncate` (audit D-02).

Skema aktif ada dalam `server/db/sql/` (Neon PostgreSQL). Jangan jalankan fail di sini
terhadap sebarang pangkalan data produksi.
